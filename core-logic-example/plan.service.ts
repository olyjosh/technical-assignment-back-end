import dayjs from 'dayjs';
import _ from 'lodash';
import omitDeep from 'omit-deep-lodash';
import {inject, injectable} from 'tsyringe';
import {DeepPartial} from 'typeorm';

import {
    BadRequest, Created, NoContent, Ok, OkOrNoContent, PaginatedResult, S3Provider
} from '@company-dep/saas-backend-common';
import {
    ArgusResponse,
    ICreatePlanRequest, IPlan, IDailyTarget, IDuplicatePlanRequest,
    IGrowthStage, IUpdatePlanRequest, IUser, IUserTaskData
} from '@company-dep/saas-models-common';

import Plan from '../../entity/Plan';
import PlanRepository from './plan.repository';
import PlanValidator from './plan.validator';
import GrowthStageRepository from '../growthStage/growthStage.repository';
import PlantRepository from '../plant/plant.repository';
import BatchAttributeRepository from '../batchAttribute/batchAttribute.repository';

@injectable()
export default class PlanService {
    constructor(
        @inject("BatchAttributeRepository") private readonly batchAttributeRepository: BatchAttributeRepository,
        @inject("PlantRepository") private readonly plantRepository: PlantRepository,
        @inject("GrowthStageRepository") private readonly growthStageRepository: GrowthStageRepository,
        @inject("PlanRepository") private readonly repository: PlanRepository,
        @inject("PlanValidator") private readonly validator: PlanValidator,
        @inject("S3Provider") private readonly s3Provider: S3Provider
    ) {
    }

    private cleanPlan(plan: any): DeepPartial<Plan> {
        const gss: { [key: string]: IGrowthStage } = {};

        plan.growthStages?.forEach((gs: any) => {
            if (gs?.id) {
                gss[gs?.id!] = gs;
            }
        });

        return {
            ...plan,
            growthStages: plan.growthStages?.map((gs: any) => ({
                ...gs,
                dailyTargets: gs?.dailyTargets?.filter((dt: IDailyTarget) => dt.growthStageId ? dt.day! <= gss[dt.growthStageId!]!.duration! : dt.day! <= gs!.duration!),
                plannedTasks: gs?.plannedTasks?.filter((pt: any) => pt.growthStageId ? pt.day! <= gss[pt.growthStageId!]!.duration! : pt!.day! <= gs!.duration!),
            }))
        }
    }

    public async Create(createRequest: ICreatePlanRequest, user: IUser, relations: string[]): Promise<ArgusResponse<Plan>> {
        const plants = await this.plantRepository.FindByIdsOrFail(createRequest.plantIds!);
        const batchAttributeIds = _.compact([
            createRequest?.targets?.flatMap(t => t?.batchAttributeId),
            createRequest?.growthStages?.flatMap(gst => gst?.plannedTasks?.flatMap(pt => (pt.taskData as IUserTaskData)?.batchAttributeId)),
            createRequest?.growthStages?.flatMap(gst => gst?.stageData?.flatMap(sd => sd?.batchAttributeId)),
        ].flat());

        const allBatchAttributes = await Promise.all(batchAttributeIds?.map(baId => this.batchAttributeRepository.FindByIdOrFail(baId)));

        this.validator.ValidateData.CreateRequest(createRequest, allBatchAttributes);

        const result = await this.repository.CreateByUser({
            ...this.cleanPlan(createRequest),
            plants: plants
        }, user, relations);

        return Created(`Cultivation Plan ${result.name} created.`, result);
    }

    public async Destroy(id: string): Promise<ArgusResponse<null>> {
        // Nested relations will be fetched by the repository delete method. We just need the batch for
        // the validator, otherwise we wouldn't even bother fetching here.
        const plan = await this.repository.FindByIdOrFail(id, ['batches']);
        this.validator.ValidateData.DestroyRequest(plan);
        await this.repository.Delete(id);
        return NoContent('Cultivation Plan deleted.');
    }

    public async DestroyGrowthStage(id: string, relations: string[]): Promise<ArgusResponse<Plan>> {
        const growthStage = await this.growthStageRepository.FindByIdOrFail(id);
        await this.growthStageRepository.Delete(id);
        const plan = await this.repository.FindByIdOrFail(growthStage.planId, relations);
        return NoContent('Growth Stage deleted.', plan);
    }

    public async Duplicate(id: string, duplicateRequest: IDuplicatePlanRequest, user: IUser, relations: string[]): Promise<ArgusResponse<Plan>> {
        const originalPlan = await this.repository.FindByIdOrFail(id, ['plants', 'growthStages', 'growthStages.dailyTargets', 'growthStages.plannedTasks', 'growthStages.stageData', 'targets']);
        const plants = await this.plantRepository.FindByIdsOrFail(duplicateRequest.plantIds!);

        this.validator.ValidateData.DuplicateRequest(duplicateRequest);

        const duplicate = {
            ...omitDeep(originalPlan, ['id', 'createdBy', 'deletedAt', 'updatedBy', 'createdAt', 'updatedAt', 'planId', 'growthStageId']) as Plan,
            plants: plants,
            ...duplicateRequest
        };

        const dailyTargets = duplicate.growthStages.map(gs => gs.dailyTargets!);
        const plannedTasks = duplicate.growthStages.map(gs => gs.plannedTasks!);
        const stageData = duplicate.growthStages.map(gs => gs.stageData!);

        const growthStages = duplicate.growthStages;

        duplicate.growthStages = duplicate.growthStages.map(gs => ({
            ...gs,
            dailyTargets: [],
            plannedTasks: [],
            stageData: []
        }));

        let result = await this.repository.CreateByUser(duplicate, user, ['plants', 'growthStages', 'growthStages.dailyTargets', 'growthStages.plannedTasks', 'growthStages.stageData', 'targets']);

        const targetIdMap: { [key: string]: string } = {};

        originalPlan.targets?.forEach(ot => {
            targetIdMap[ot.id] = result.targets?.find(dt => ot.dataInputType == dt.dataInputType && ot.batchAttributeId == dt.batchAttributeId)?.id!
        });

        result.growthStages = growthStages.map(gs => ({
            ...gs,
            dailyTargets: dailyTargets[gs.order].map(dt => ({
                ...dt,
                targetId: targetIdMap[dt.targetId],
                growthStageId: gs.id
            })),
            plannedTasks: plannedTasks[gs.order].map(pt => ({...pt, growthStageId: gs.id})),
            stageData: stageData[gs.order].map(pt => ({...pt, growthStageId: gs.id})),
        }));

        result = await this.repository.UpdateById(id, result, relations);

        return Created(`Cultivation Plan ${result.name} created.`, result);
    }

    public async Index(siteId: string, relations: string[], skip?: number | undefined, take?: number | undefined): Promise<ArgusResponse<PaginatedResult<IPlan>>> {
        const result = await this.repository.FindPaginated({
            where: {siteId: siteId},
            relations: relations,
            skip: skip,
            take: take
        }) as PaginatedResult<IPlan>;
        const batchCounts = await this.repository.GetLiveBatchesPrePlanCount(siteId);

        result.entries.forEach(p => {
            p.batchCount = batchCounts[p.id!];
        });

        return OkOrNoContent(`Found ${result.total} Cultivation Plan${result.total != 1 ? 's' : ''}.`, 'No Cultivation Plan was found.', result);
    }

    public async Show(id: string, relations: string[]): Promise<ArgusResponse<Plan>> {
        const entity = await this.repository.FindByIdOrFail(id, relations);

        return Ok('Cultivation Plan Found.', entity);
    }

    public async Update(id: string, updateRequest: IUpdatePlanRequest, newPhotos: any[], user: IUser, relations: string[]): Promise<ArgusResponse<IPlan>> {
        const plan = await this.repository.FindByIdOrFail(id);
        const plants = await this.plantRepository.FindByIdsOrFail(updateRequest.plantIds!);
        const batchAttributeIds = _.compact([
            updateRequest?.targets?.flatMap(t => t?.batchAttributeId),
            updateRequest?.growthStages?.flatMap(gst => gst?.plannedTasks?.flatMap(pt => (pt.taskData as IUserTaskData)?.batchAttributeId)),
            updateRequest?.growthStages?.flatMap(gst => gst?.stageData?.flatMap(sd => sd?.batchAttributeId)),
        ].flat());

        const allBatchAttributes = await Promise.all(batchAttributeIds?.map(baId => this.batchAttributeRepository.FindByIdOrFail(baId)));

        this.validator.ValidateData.UpdateRequest(updateRequest, plan.siteId, allBatchAttributes);

        if (newPhotos.length) {
            const allPlannedTasks = _.flatten(updateRequest.growthStages?.map(gs => gs.plannedTasks));
            const newPlannedTask = allPlannedTasks.find(pt => !pt!.id);
            const editingPlannedTask = allPlannedTasks.find(pt => pt!.isEditingPhotos);

            try {
                const uploadedPhotos = (await this.s3Provider.UploadPhotos(plan.siteId, newPhotos)).data;
                const imageKeys = uploadedPhotos!.map(imageKey => imageKey)

                if (newPlannedTask)
                    (newPlannedTask.taskData as IUserTaskData).photos = [...((newPlannedTask.taskData as IUserTaskData).photos || []), ...imageKeys];
                if (editingPlannedTask) {
                    if ((editingPlannedTask.taskData as IUserTaskData).photos) (editingPlannedTask.taskData as IUserTaskData).photos!.push(...imageKeys)
                    else (editingPlannedTask.taskData as IUserTaskData).photos = imageKeys;
                }
            } catch (e) {
                return BadRequest((e as any).message)
            }
        }

        const result = await this.repository.UpdateByUser(plan, {
            ...this.cleanPlan(updateRequest),
            plants: plants,
            updatedAt: dayjs().utc().toDate()
        }, user, relations) as IPlan;

        const batchCounts = await this.repository.GetLiveBatchesPrePlanCount(plan.siteId);
        result.batchCount = batchCounts[plan.id];

        return Ok(`Cultivation Plan ${result.name} updated.`, result);
    }
}
