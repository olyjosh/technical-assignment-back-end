import {AppController} from "./app.controller";
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

      jest.spyOn(appService, 'getVenues').mockImplementation(() => result);

      const venues = await appController.getVenues();

      expect(venues).toBe(result);
      // expect(1+1).toBe(2)
    });
  });
});
