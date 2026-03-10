package io.orbitlink.config;

import io.orbitlink.model.GroundStation;
import io.orbitlink.model.Satellite;
import io.orbitlink.model.User;
import io.orbitlink.repository.GroundStationRepository;
import io.orbitlink.repository.SatelliteRepository;
import io.orbitlink.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

        private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

        private final UserRepository userRepo;
        private final SatelliteRepository satelliteRepo;
        private final GroundStationRepository stationRepo;
        private final PasswordEncoder passwordEncoder;

        public DataSeeder(UserRepository userRepo, SatelliteRepository satelliteRepo,
                        GroundStationRepository stationRepo, PasswordEncoder passwordEncoder) {
                this.userRepo = userRepo;
                this.satelliteRepo = satelliteRepo;
                this.stationRepo = stationRepo;
                this.passwordEncoder = passwordEncoder;
        }

        @Override
        public void run(String... args) {
                if (userRepo.count() > 0) {
                        log.info("Data already seeded, skipping");
                        return;
                }

                log.info("Seeding initial data...");
                String seedPassword = System.getenv("SEED_PASSWORD");
                if (seedPassword == null || seedPassword.isBlank())
                        seedPassword = "change-me-on-first-login";
                String hash = passwordEncoder.encode(seedPassword);

                seedUser("operator@orbitlink.io", hash, User.Role.OPERATOR);
                seedUser("admin@orbitlink.io", hash, User.Role.ADMIN);
                seedUser("analyst@orbitlink.io", hash, User.Role.ANALYST);

                seedSatellite("ISS (ZARYA)", 25544, 51.6, 408,
                                "1 25544U 98067A   24001.00000000  .00016717  00000-0  10270-3 0  9002",
                                "2 25544  51.6400 208.9163 0006703  40.5765 319.5681 15.49297436484041");
                seedSatellite("STARLINK-1007", 44713, 53.0, 550,
                                "1 44713U 19074A   24001.00000000  .00001100  00000-0  55000-4 0  9008",
                                "2 44713  53.0000  50.0000 0001800 150.0000  10.1000 15.06000000 28000");
                seedSatellite("STARLINK-2305", 48274, 53.0, 550,
                                "1 48274U 21035A   24001.00000000  .00000120  00000-0  58000-5 0  9012",
                                "2 48274  53.0000 140.0000 0008000  90.0000 270.2000 15.00000000 18000");
                seedSatellite("STARLINK-4781", 55021, 53.2, 540,
                                "1 55021U 23015A   24001.00000000  .00000200  00000-0  90000-5 0  9020",
                                "2 55021  53.2000 100.0000 0010000  40.0000 320.0000 14.95000000  6000");
                seedSatellite("GPS IIF-12", 41019, 55.0, 20200,
                                "1 41019U 15062A   24001.00000000  .00000001  00000-0  10000-3 0  9040",
                                "2 41019  55.0000 200.0000 0050000 260.0000 100.0000  2.00564000 10000");
                seedSatellite("GPS III SV05", 53239, 55.0, 20200,
                                "1 53239U 22120A   24001.00000000  .00000001  00000-0  10000-3 0  9018",
                                "2 53239  55.0000 180.0000 0020000 220.0000 140.0000  2.00564000  9000");
                seedSatellite("GOES-18", 51850, 0.03, 35786,
                                "1 51850U 22021A   24001.00000000  .00000001  00000-0  10000-3 0  9030",
                                "2 51850   0.0300 270.0000 0001000  90.0000 270.0000  1.00274000  5000");
                seedSatellite("LANDSAT-9", 49260, 98.2, 705,
                                "1 49260U 21090A   24001.00000000  .00002000  00000-0  85000-4 0  9014",
                                "2 49260  98.2000 260.0000 0003000 170.0000  90.1000 14.57000000 15000");
                seedSatellite("SBIRS GEO-5", 49817, 0.05, 35786,
                                "1 49817U 22001A   24001.00000000  .00000001  00000-0  10000-3 0  9032",
                                "2 49817   0.0500  80.0000 0002000 200.0000 160.0000  1.00274000  4000");
                seedSatellite("TDRS-13", 43781, 0.02, 35786,
                                "1 43781U 18091A   24001.00000000  .00000001  00000-0  10000-3 0  9034",
                                "2 43781   0.0200 175.0000 0003000 100.0000 260.0000  1.00274000  8000");
                seedSatellite("SENTINEL-6A", 46984, 66.0, 1336,
                                "1 46984U 20084A   24001.00000000  .00000080  00000-0  35000-5 0  9036",
                                "2 46984  66.0000 310.0000 0001000  50.0000 310.0000 14.52000000  7000");
                seedSatellite("MUOS-5", 41622, 4.6, 35786,
                                "1 41622U 16041A   24001.00000000  .00000001  00000-0  10000-3 0  9038",
                                "2 41622   4.6000 120.0000 0005000 280.0000  80.0000  1.00274000  6000");

                seedStation("Svalbard SvalSat", 78.2306, 15.3894, 450, 6, "Arctic");
                seedStation("Fairbanks NOAA", 64.8594, -147.8386, 160, 4, "North America");
                seedStation("Wallops Island", 37.9402, -75.4664, 5, 5, "North America");
                seedStation("Canberra DSN", -35.4014, 148.9817, 680, 4, "Oceania");
                seedStation("Kourou CSG", 5.2361, -52.7686, 15, 4, "South America");
                seedStation("Maspalomas INTA", 27.7633, -15.6342, 205, 3, "Europe");
                seedStation("Tromso SatOps", 69.6628, 18.9406, 130, 4, "Europe");
                seedStation("McMurdo Station", -77.8419, 166.6686, 10, 3, "Antarctica");

                log.info("Data seeding complete: 3 users, 12 satellites, 8 ground stations");
        }

        private void seedUser(String email, String hash, User.Role role) {
                User u = new User();
                u.setEmail(email);
                u.setPasswordHash(hash);
                u.setRole(role);
                userRepo.save(u);
        }

        private void seedSatellite(String name, int norad, double inc, double alt, String tle1, String tle2) {
                Satellite s = new Satellite();
                s.setName(name);
                s.setNoradId(norad);
                s.setInclination(inc);
                s.setAltitudeKm(alt);
                s.setTleLine1(tle1);
                s.setTleLine2(tle2);
                satelliteRepo.save(s);
        }

        private void seedStation(String name, double lat, double lon, double elev, int cap, String region) {
                GroundStation gs = new GroundStation();
                gs.setName(name);
                gs.setLatitude(lat);
                gs.setLongitude(lon);
                gs.setElevationM(elev);
                gs.setCapacity(cap);
                gs.setRegion(region);
                stationRepo.save(gs);
        }
}
