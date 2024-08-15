import {AppController, Query} from "./app.controller";
import {AppService, Venue} from "./app.service";
import {VenueRepository} from "./venue/venue.repository";


describe('AppController', () => {

  let appController: AppController;
  let appService: AppService;
  let venueRepository: VenueRepository;
  
  beforeEach(() => {
    venueRepository = new VenueRepository();
    appService = new AppService(venueRepository);
    appController = new AppController(appService);
  })

  describe('getVenues', () => {
    it('should return an array of many venues', async () => {
      const result = [
        {
          id: 1,
          name: "Vipe",
          country_iso2: "CZ",
          state: null,
          city: "Čeladná",
        },
        {
          id: 2,
          name: "Blogspan",
          country_iso2: "FR",
          state: "Alsace",
          city: "Haguenau",
      }
      ] as Venue[];

      jest.spyOn(appService, 'getVenues').mockImplementation(async() => result);

      const venues = await appController.getVenues({} as Query);

      expect(appService.getVenues).toHaveBeenCalledWith(undefined);
      expect(venues).toBe(result);

    });

    it('should return an array of 1 venue', async () => {
      const query = {limit: 1};
      const result = [
        {
          id: 1,
          name: "Vipe",
          country_iso2: "CZ",
          state: null,
          city: "Čeladná",
        }
      ] as Venue[];

      jest.spyOn(appService, 'getVenues').mockImplementation(async() => result);

      const venues = await appController.getVenues(query);

      expect(appService.getVenues).toHaveBeenCalledWith(query.limit);
      expect(venues).toBe(result);
    });
  });
});
