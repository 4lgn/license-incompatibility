package bachelor;

import org.neo4j.graphdb.*;
import org.neo4j.procedure.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Stream;

import com.github.zafarkhaja.semver.Version;

public class MergeVersions {
    @Context
    public Transaction tx;

    @Procedure(value = "bachelor.mergeVersions", mode = Mode.WRITE, name = "mergeVersions")
    @Description("mergeVersions(versions, startNode) - merges versions with the same dependencies and requirements by creating MetaVersion nodes.")
    public void mergeVersions(@Name("nodes") List<Node> nodes, @Name("node") Node startNode) {
        // This Map will be the main way of merging versions with the same
        // dependencies and requirements. The idea is to map a string containing
        // a standardized representation of the version node's
        // VERSION_DEPENDS_ON relationships (project id and dependency
        // requirement) to a list of all the version node's with the same
        // representation. This allows us to group all version nodes that depend
        // on the same projects, with the same dependency requirements.
        HashMap<String, List<Node>> nodeGroups = new HashMap<>();

        for (Node node : nodes) {
            List<String> names = new ArrayList<>();

            // Run through all outgoing VERSION_DEPENDS_ON relationships of the
            // version node, and add its end node id (project) concatenated with
            // the dependency requirement to the names array list.
            for (Relationship rel : node.getRelationships(Direction.OUTGOING)) {
                if (rel.getType().name().equals("VERSION_DEPENDS_ON")) {
                    names.add(rel.getEndNodeId() + (String) rel.getProperty("dependencyRequirement"));
                }
            }

            // We sort the names collection, and join it back into a long string to standardize it
            java.util.Collections.sort(names);
            String joinedNames = String.join("", names);

            if (!nodeGroups.containsKey(joinedNames)) {
                // If this is a new unique version (because of its different
                // dependencies or requirements), we just put this version node
                // as the only node in the list for its unique string identifier
                // in our hashmap
                List<Node> newNodes = new ArrayList<>();
                newNodes.add(node);
                nodeGroups.put(joinedNames, newNodes);
            } else {
                // If this version requirement and dependencies already exists
                // (we can merge), we simply add the version node to the
                // identifier's list.
                nodeGroups.get(joinedNames).add(node);
            }
        }

        // Create a MetaVersion node for each version node group. This will
        // represent the version nodes as a single node.
        for (List<Node> nodeGroup : nodeGroups.values()) {
            // Create the node and its label
            Label l = Label.label("MetaVersion");
            Node metaVersionNode = tx.createNode(l);
            // Each MetaVersion will still represent a version of the starting
            // project node - so let's keep those relationships
            startNode.createRelationshipTo(metaVersionNode, RelationshipType.withName("HAS_VERSION"));

            // Each entry to a node group will always at least contain 1 element
            // (the unique version node), and as each version node in the group
            // will have the same VERSION_DEPENDS_ON relationships (to the same
            // projects and with the same dependency requirements), we can
            // simply use the relationships of the first node in the list.
            for (Relationship rel : nodeGroup.get(0).getRelationships(Direction.OUTGOING)) {
                // Here we just make sure to maintain all the VERSION_DEPENDS_ON
                // relationships the version nodes had - essentially just
                // copying them over to the MetaVersion node
                if (rel.getType().name().equals("VERSION_DEPENDS_ON")) {
                    metaVersionNode
                        .createRelationshipTo(rel.getEndNode(), rel.getType())
                        .setProperty("dependencyRequirement", rel.getProperty("dependencyRequirement"));
                }
            }

            // Keep track of the version numbers we merged into the MetaVersion
            // by keeping relationships (INCLUDES_VERSION) to each of them from
            // the MetaVersion node, and by later setting a property on the
            // MetaVersion node containing all the numbers as a string.
            HashSet<String> versionSet = new HashSet<>();

            // Adding each number to the versions set and creating relationships...
            for (Node versionNode : nodeGroup) {
                Object nodeVersionNumber = versionNode.getProperty("number");
                if (nodeVersionNumber != null) {
                    try {
                        versionSet.add((String) nodeVersionNumber);
                    } catch (Exception ignored) { }
                }
                metaVersionNode.createRelationshipTo(versionNode, RelationshipType.withName("INCLUDES_VERSION"));
            }

            // Joining the set into a string
            String separatedVersions = String.join(",", versionSet);
            // Setting the property
            metaVersionNode.setProperty("number", separatedVersions);
        }
    }
}
