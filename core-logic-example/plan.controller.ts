import {Request as ExRequest} from 'express';
import {
    Body, Controller, Delete, Get, Path, Post, Put, Query, Request, Route, Security, Tags
} from 'tsoa';
import {inject, injectable} from 'tsyringe';

import {
    GET_SITE_ID_FROM_ENTITY, GET_SITE_ID_FROM_REQUEST, PaginatedResult
} from '@company-dep/saas-backend-common';
import {
    ArgusResponse,
    FocusRoles, ICreatePlanRequest, IPlan, IDuplicatePlanRequest,
    IUpdatePlanRequest
} from '@company-dep/saas-models-common';

import Plan from '../../entity/Plan';
import PlanService from './plan.service';
import PlanValidator from './plan.validator';

@injectable()
@Route('/cultivation-plan')
@Tags('Cultivation Plan')
export class PlanController extends Controller {
    constructor(
        @inject("PlanService") private readonly service: PlanService,
        @inject("PlanValidator") private readonly validator: PlanValidator
    ) {
        super();
    }

    @Security("jwt", [GET_SITE_ID_FROM_REQUEST, FocusRoles.CULTIVATION_PLAN_CREATE])
    @Post('/')
    public async Create(@Body() createRequest: ICreatePlanRequest, @Request() request: ExRequest, @Query() relations: string[] = []): Promise<ArgusResponse<Plan>> {
        this.validator.ValidateSchema.CreateRequest(createRequest);
        return this.service.Create(createRequest, request.user, relations);
    }

    @Security("jwt", [GET_SITE_ID_FROM_ENTITY, "Plan", FocusRoles.CULTIVATION_PLAN_CREATE])
    @Post('/duplicate-plan/{id}')
    public async DuplicatePlan(@Path() id: string, @Body() duplicateRequest: IDuplicatePlanRequest, @Request() request: ExRequest, @Query() relations: string[] = []): Promise<ArgusResponse<Plan>> {
        this.validator.ValidateSchema.DuplicateRequest(duplicateRequest);
        return this.service.Duplicate(id, duplicateRequest, request.user, relations);
    }

    @Security("jwt", [GET_SITE_ID_FROM_ENTITY, "Plan", FocusRoles.CULTIVATION_PLAN_DELETE])
    @Delete('/{id}')
    public async Destroy(@Path() id: string): Promise<ArgusResponse> {
        return this.service.Destroy(id);
    }

    @Security("jwt", [GET_SITE_ID_FROM_ENTITY, "GrowthStage:plan", FocusRoles.CULTIVATION_PLAN_DELETE])
    @Delete('/growth-stage/{id}')
    public async DestroyGrowthStage(@Path() id: string, @Query() relations: string[] = []): Promise<ArgusResponse<Plan>> {
        return this.service.DestroyGrowthStage(id, relations);
    }

    @Security("jwt", [GET_SITE_ID_FROM_REQUEST, FocusRoles.VIEW_ANALYZE, FocusRoles.VIEW_MONITOR])
    @Get('/site/{siteId}')
    public async Index(@Path() siteId: string, @Query() skip?: number, @Query() take?: number, @Query() relations: string[] = []): Promise<ArgusResponse<PaginatedResult<IPlan>>> {
        return this.service.Index(siteId, relations, skip, take);
    }

    @Security("jwt", [GET_SITE_ID_FROM_ENTITY, "Plan", FocusRoles.VIEW_ANALYZE, FocusRoles.VIEW_MONITOR])
    @Get('/{id}')
    public async Show(@Path() id: string, @Query() relations: string[] = []): Promise<ArgusResponse<Plan>> {
        return this.service.Show(id, relations);
    }

    @Security("jwt", [GET_SITE_ID_FROM_ENTITY, "Plan", FocusRoles.CULTIVATION_PLAN_UPDATE])
    @Put('/{id}')
    public async Update(@Path() id: string, @Body() updateRequest: IUpdatePlanRequest, @Request() request: ExRequest, @Query() relations: string[] = []): Promise<ArgusResponse<IPlan>> {
        const newPhotos: any = request.files;

        this.validator.ValidateSchema.UpdateRequest(updateRequest);
        return this.service.Update(id, updateRequest, newPhotos, request.user, relations);
    }
}
