package bachelor;

import org.neo4j.logging.Log;
import org.neo4j.procedure.Context;
import org.neo4j.procedure.Description;
import org.neo4j.procedure.Name;
import org.neo4j.procedure.UserFunction;
import com.github.zafarkhaja.semver.Version;

import com.github.zafarkhaja.semver.Version;
import static com.github.zafarkhaja.semver.expr.CompositeExpression.Helper.*;

import java.util.List;
import java.util.regex.Pattern;

public class CompareVersions {

    /*
    Use static fields to only compile each regex pattern once, and not for every function invocation.
    */
    public static Pattern anyPattern = Pattern.compile("(any|\\*)");
    public static Pattern orPattern = Pattern.compile("or");
    public static Pattern equalsPattern = Pattern.compile("==");
    public static Pattern deleteExtraVersioningPattern = Pattern.compile("-(alpha|beta|rc|pre|dev)(\\.\\d+)?");
    public static Pattern removeSpacePattern = Pattern.compile("([<>=]) ");
    public static Pattern caretPattern = Pattern.compile("~>");
    public static Pattern keepSpacePattern = Pattern.compile("(\\d)([<>=])");
    public static Pattern ampersandTestPattern = Pattern.compile("^.*[^&|] [^&|].*$");
    public static Pattern ampersandReplacePattern = Pattern.compile(" ");
    public static Pattern patchInfoPattern = Pattern.compile("\\+\\d+");
    public static Pattern commaPattern = Pattern.compile(",");
    public static Pattern removeLeadingZeroPattern = Pattern.compile("\\.0(\\d+)");

    @Context
    public Log log;

    @UserFunction
    @Description("bachelor.compareVersion(dependencyRequirement, version) - check if version is compatible with the dependency requirement.")
    public boolean compareVersion(
            @Name("dependencyRequirement") String dependencyRequirement,
            @Name("version") String version) {
        if (dependencyRequirement == null || version == null) {
            throw new IllegalArgumentException();
        }
        try {
            boolean result = false;

            // If any dep. req. we just return true
            if (anyPattern.matcher(dependencyRequirement).matches()) return true;

            dependencyRequirement = orPattern.matcher(dependencyRequirement).replaceAll("|");
            dependencyRequirement = equalsPattern.matcher(dependencyRequirement).replaceAll("=");

            // remove: -alpha, -beta, -rc.x, -pre.x, -dev.x
            dependencyRequirement = deleteExtraVersioningPattern.matcher(dependencyRequirement).replaceAll("");

            dependencyRequirement = removeSpacePattern.matcher(dependencyRequirement).replaceAll("$1");
            dependencyRequirement = caretPattern.matcher(dependencyRequirement).replaceAll("^");
            dependencyRequirement = keepSpacePattern.matcher(dependencyRequirement).replaceAll("$1 $2");

            // Dep. Req. without ampersand (just space) separating, ... put in ampersand
            if (ampersandTestPattern.matcher(dependencyRequirement).matches()) {
                dependencyRequirement = ampersandReplacePattern.matcher(dependencyRequirement).replaceAll(" & ");
            }
            // Remove patch information in dep. req.
            dependencyRequirement = patchInfoPattern.matcher(dependencyRequirement).replaceAll("");

            dependencyRequirement = commaPattern.matcher(dependencyRequirement).replaceAll("");
            dependencyRequirement = removeLeadingZeroPattern.matcher(dependencyRequirement).replaceAll(".$1");

            String[] versionSplit = version.split((","));
            if (versionSplit.length > 1) {
                for (String versionSeparated : versionSplit) {
                    Version v = Version.valueOf(versionSeparated);
                    result = v.satisfies(dependencyRequirement);
                    // If we found a version that holds dependency requirement, return true
                    if (result) return true;
                }
            } else {
                Version v = Version.valueOf(version);
                result = v.satisfies(dependencyRequirement);
            }

            return result;
        } catch (Exception e) {
            log.error("CompareVersions: Could not understand version: \"" + version + "\" with req \"" + dependencyRequirement + "\"");
            return false;
        }
    }
}
