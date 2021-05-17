# License incompatibilities in open source projects

This repository contains various scripts and files for the bachelor thesis "License incompatibilities in open source projects"

The repository is split up into two main folders:

- `tool`: The license incompatibility tool created to assist software developers in checking their own private repositories for potential license incompatibilities. It contains the ReactJS frontend code and the Express backend code.
- `experiment`: Scripts and other resources used to performn the license incompatibility experiment as explained in the paper. The database is generated and set up using the scripts found under `generator`, and the experiment can be run using the NodeJS script found in the `runner` folder.

## Tool

To run, one must start both the backend server and the local development frontend server.

Make sure that you also have a Neo4j database instance running in the background, which can be generated using the scripts in the `experiment` folder, as explained in its appropriate section.

### Backend

First, install the dependencies:

`$ yarn`

Next, launch the the development server with optional environment variables to set the password, database name, port, etc.

`$ DB_PASS=password DB_NAME=neo4j DB_PORT=7687 yarn start`

### Frontend

First, install the dependencies:

`$ yarn`

Next, launch the development server:

`$ yarn start`

### Usage

Follow the steps as shown on the website at `http://localhost:3000`. To test it out, you can use the default license model, and use the example `package.json` found in `tool/frontend/src/package.json`.

## Experiment

First, we need to generate and setup the Neo4j database. Ensure you have a working installation of Docker, Python, Java and Node to be able to run the experiment. Furthermore, you must have the [Libraries.io dataset](https://doi.org/10.5281/zenodo.3626071) installed and unzipped in a folder on your system.

With this, we can generate all the needed data and setup our database with the `setup.sh` script found in the `experiment/generator/` folder. To generate the data for the Cargo package manager, with the Libraries.io data located at `/path/to/librariesio-data`, and the chosen Neo4j home directory at `/path/to/neo4j-home`, the script can be run as follows:

`./setup.sh -p Cargo -H "/path/to/neo4j-home" -n neo4jdb-cargo -d /path/to/libariesio-data`

Feel free to use the `-h` flag if you want all the possible commands.

This will probably take a couple of minutes - go grab a coffee in the meantime.

Next, to run the actual experiment, we can do so in the `/experiment/runner/` folder, with the NodeJS script `index.js`. This needs to be supplied the password to the associated Neo4j database instance with the `DB_PASS` environment variable - in the case of our auto-generated instance, it is simply "password". Thus, we can run the experiment like so:

`DB_PASS=password node index.js`

This can also be piped into a file, as the output can easily be more than 10k lines:

`DB_PASS=password node index.js > cargo.txt`
