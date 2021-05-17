package bachelor;
import bachelor.CompareVersions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.neo4j.driver.Config;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.neo4j.driver.Session;
import org.neo4j.harness.Neo4j;
import org.neo4j.harness.Neo4jBuilders;

import static org.assertj.core.api.Assertions.assertThat;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class CompareVersionsTest {

    private static final Config driverConfig = Config.builder().withoutEncryption().build();
    private Neo4j embeddedDatabaseServer;

    @BeforeAll
    void initializeNeo4j() {
        this.embeddedDatabaseServer = Neo4jBuilders.newInProcessBuilder()
                .withDisabledServer()
                .withFunction(CompareVersions.class)
                .build();
    }

    @Test
    void comparesVersion() {
        // This is in a try-block, to make sure we close the driver after the test
        try(Driver driver = GraphDatabase.driver(embeddedDatabaseServer.boltURI(), driverConfig);
            Session session = driver.session()) {

            // When
            long startTime = System.currentTimeMillis();
            boolean result1 = session.run( "RETURN bachelor.compareVersion('>0.50', '0.50.2-0.50.8') AS result").single().get("result").asBoolean();
            boolean result2 = session.run( "RETURN bachelor.compareVersion('>0.50', '0.50.1-0.6') AS result").single().get("result").asBoolean();
            boolean result3 = session.run( "RETURN bachelor.compareVersion('>0.50', '0.49.6-0.50.8') AS result").single().get("result").asBoolean();
            boolean result4 = session.run( "RETURN bachelor.compareVersion('>=0.6.5 & <0.8.0', '0.6.7+1') AS result").single().get("result").asBoolean();

            boolean result5_1 = session.run( "RETURN bachelor.compareVersion('>0.6.4', '0.7.0') AS result").single().get("result").asBoolean();
            boolean result5_2 = session.run( "RETURN bachelor.compareVersion('>0.6.4+2', '0.7.0') AS result").single().get("result").asBoolean();
            boolean result5_6 = session.run( "RETURN bachelor.compareVersion('>=0.5.0 & <0.8.0', '0.7.0') AS result").single().get("result").asBoolean();
            boolean result5_5 = session.run( "RETURN bachelor.compareVersion('>=0.5.0+1 & <0.8.0', '0.7.0') AS result").single().get("result").asBoolean();

            boolean result5_3 = session.run( "RETURN bachelor.compareVersion('>0.6.4', '0.7.0+8') AS result").single().get("result").asBoolean();
            boolean result5_4 = session.run( "RETURN bachelor.compareVersion('>0.6.4+2', '0.7.0+8') AS result").single().get("result").asBoolean();

            boolean result6 = session.run( "RETURN bachelor.compareVersion('any', '0.3.0') AS result").single().get("result").asBoolean();
            boolean result7 = session.run( "RETURN bachelor.compareVersion('any', '0.3.0+8') AS result").single().get("result").asBoolean();
            boolean result8 = session.run( "RETURN bachelor.compareVersion('^0.6.4+2', '0.6.8+8') AS result").single().get("result").asBoolean();

            boolean result9 = session.run( "RETURN bachelor.compareVersion('>=0.9.0 <2.0.0', '1.1.1') AS result").single().get("result").asBoolean();

            boolean result10 = session.run( "RETURN bachelor.compareVersion('^5.0.0-alpha', '5.0.1') AS result").single().get("result").asBoolean();
            boolean result11 = session.run( "RETURN bachelor.compareVersion('^5.0.0-beta', '5.0.1') AS result").single().get("result").asBoolean();
            boolean result12 = session.run( "RETURN bachelor.compareVersion('>=1.0.0 < 2.0.0', '1.4.4') AS result").single().get("result").asBoolean();
            boolean result13 = session.run( "RETURN bachelor.compareVersion('>= 0.11.0 < 0.12.0', '0.11.1') AS result").single().get("result").asBoolean();
            boolean result14 = session.run( "RETURN bachelor.compareVersion('~> 1.0.0', '1.0.1') AS result").single().get("result").asBoolean();

            boolean result15 = session.run( "RETURN bachelor.compareVersion('>=0.31.1<0.32.00', '0.31.2') AS result").single().get("result").asBoolean();
            boolean result16 = session.run( "RETURN bachelor.compareVersion('>=0.31.1<0.32.05', '0.31.1') AS result").single().get("result").asBoolean();
            long endTime = System.currentTimeMillis();

            System.out.println("Took " + (endTime - startTime) + "ms");

            // Then
            assertThat(result1).isEqualTo(true);
            assertThat(result2).isEqualTo(true);
            assertThat(result3).isEqualTo(false);

            assertThat(result4).isEqualTo(true);

            assertThat(result5_6).isEqualTo(true);
            assertThat(result5_5).isEqualTo(true);

            assertThat(result5_1).isEqualTo(true);
            assertThat(result5_3).isEqualTo(true);
            assertThat(result5_2).isEqualTo(true);
            assertThat(result5_4).isEqualTo(true);

            assertThat(result6).isEqualTo(true);
            assertThat(result7).isEqualTo(true);
            assertThat(result8).isEqualTo(true);

            assertThat(result9).isEqualTo(true);

            assertThat(result10).isEqualTo(true);
            assertThat(result11).isEqualTo(true);
            assertThat(result12).isEqualTo(true);
            assertThat(result13).isEqualTo(true);
            assertThat(result14).isEqualTo(true);

            assertThat(result15).isEqualTo(true);
            assertThat(result16).isEqualTo(true);
        }
    }
}
