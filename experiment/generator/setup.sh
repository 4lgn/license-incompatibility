#/bin/bash

# Defaults
DOCKERNAME=neo4jdb

Help()
{
   echo "Licensemate expirement setup script."
   echo
   echo "Syntax: setup.sh [-H|d|n|p]"
   echo
   echo "Required parameters:"
   echo "H     Neo4j Home directory (volumes on docker container, incl. import and plugins folders)"
   echo "d     Path containing libraries.io data"
   echo
   echo "Optional parameters:"
   echo "n     Name of docker container"
   echo "p     Optional platform to filter projects by (only include data from given platform)"
   echo
}

while getopts "hH:d:n:p:rR" opt; do
  case $opt in
    H) NEOHOME=${OPTARG}    ;;
    d) DATAPATH=${OPTARG}   ;;
    n) DOCKERNAME=${OPTARG} ;;
    p) PLATFORM=${OPTARG}   ;;
    h) Help
       exit                 ;;
    *) echo 'Error' >&2
       exit 1               ;;
  esac
done

# Check required arguments
if [ -z "$NEOHOME" ]
then
    echo "Error: You must supply a neo4j home directory with the argument -H"
    exit 1
fi

if [ -z "$DATAPATH" ]
then
    echo "Error: You must supply a libraries io data path with the argument -d"
    exit 1
fi


mkdir -p $NEOHOME/import
mkdir -p $NEOHOME/data
mkdir -p $NEOHOME/plugins

if [ "$(ls -A $NEOHOME/import 2>&1)" ]
then
    read -p "Import data was already found in '${NEOHOME}/import'. Do you want to remove it? (y/n): " -r
    if [ "$REPLY" = "y" ]
    then
        echo "Cleaning your neo4j import data..."
        rm -rf $NEOHOME/import/*
        echo "Done!"
    fi
fi
if [ "$(ls -A $NEOHOME/data 2>&1)" ]
then
    read -p "DBMS data is present in '${NEOHOME}/data'. Importing data will not work with this present, do you want to remove it? (y/n): " -r
    if [ "$REPLY" = "y" ]
    then
        echo "Cleaning your neo4j dbms data..."
        rm -rf $NEOHOME/data/*
        echo "Done!"
    fi
fi

if [ "$(sudo docker ps -a | grep $DOCKERNAME 2>&1)" ]
then
    read -p "A ${DOCKERNAME} docker instance was found. Do you want to remove it? (y/n): " -r
    if [ "$REPLY" = "y" ]
    then
        echo "Deleting already existing ${DOCKERNAME} docker instance"
        docker stop $DOCKERNAME
        docker rm $DOCKERNAME
        echo "Done!"
    fi
fi


if [ "$(ls -A $NEOHOME/plugins 2>&1)" ]
then
    read -p "Do you want to re-compile your neo4j plugins? (y/n): " -r
    if [ "$REPLY" = "y" ]
    then
        echo "Building required plugins for neo4j..."
        (cd ../plugins && mvn package && mv ./target/procedure-template-1.0.0-SNAPSHOT.jar $NEOHOME/plugins/)
    fi
else
    echo "Building required plugins for neo4j..."
    (cd ../plugins && mvn package && mv ./target/procedure-template-1.0.0-SNAPSHOT.jar $NEOHOME/plugins/)
fi

if [ ! -f $NEOHOME/plugins/apoc-4.2.0.2-all.jar ]
then
    echo "Including APOC procedures as plugin"
    cp ../resources/apoc-4.2.0.2-all.jar $NEOHOME/plugins/
fi

read -p "Do you want to generate new data using gen.py? (y/n): " -r
if [ "$REPLY" = "y" ]
then
    if [ -z "$PLATFORM" ]
    then
        python gen.py $DATAPATH $NEOHOME/import
    else
        python gen.py $DATAPATH $NEOHOME/import $PLATFORM
    fi
fi

docker run \
    --name $DOCKERNAME \
    -d \
    -p7474:7474 \
    -p7687:7687 \
    -v $NEOHOME/data:/var/lib/neo4j/data \
    -v $NEOHOME/import:/var/lib/neo4j/import \
    -v $NEOHOME/logs:/var/lib/neo4j/logs \
    -v $NEOHOME/plugins:/var/lib/neo4j/plugins \
    --env NEO4J_AUTH=neo4j/password \
    --env NEO4J_dbms_security_procedures_unrestricted=gds.\\\* \
    neo4j:4.2

echo "Importing data..."

docker exec -w /var/lib/neo4j/import $DOCKERNAME neo4j-admin import \
    --database neo4j \
    --skip-bad-relationships=true \
    --nodes=Project="projects_header.csv,projects.csv" \
    --nodes=License="licenses_header.csv,licenses.csv" \
    --nodes=Version="versions_header.csv,versions.csv" \
    --relationships=HAS_LICENSE="project-licenses_header.csv,project-licenses.csv" \
    --relationships=HAS_VERSION="project-versions_header.csv,project-versions.csv" \
    --relationships=PROJECT_DEPENDS_ON="project-dependencies_header.csv,project-dependencies.csv" \
    --relationships=VERSION_DEPENDS_ON="version-dependencies_header.csv,version-dependencies.csv" \
    --relationships=IS_INCOMPATIBLE_WITH="license-incompatibilities_header.csv,license-incompatibilities.csv"



sleep 10

echo "Restarting.."

docker container restart $DOCKERNAME
sleep 5
echo "Starting..."
docker exec $DOCKERNAME neo4j start
echo "Started, waiting a bit for neo4j server to be online"
sleep 120

echo "Creating indexes..."
docker exec $DOCKERNAME cypher-shell -u neo4j -p password -d neo4j "CREATE INDEX pName FOR (p:Project) ON (p.name);"
docker exec $DOCKERNAME cypher-shell -u neo4j -p password -d neo4j "CREATE INDEX pPlatform FOR (p:Project) ON (p.platform);"

echo "Counting nodes..."
docker exec $DOCKERNAME cypher-shell -u neo4j -p password -d neo4j "MATCH (p) RETURN COUNT(p);"
