#!/bin/bash

exit 0

export GHUSER=rshaker
export GHREPO=multiselect-blockly
# export PATOKEN=see_password_vault

# List all deployments
deployments=$(curl -s -H "Authorization: token ${PATOKEN}" \
    "https://api.github.com/repos/${GHUSER}/${GHREPO}/deployments")

# Extract deployment IDs (assuming jq is installed)
ids=$(echo "$deployments" | jq '.[] | .id')

# Loop through each deployment ID and delete
for id in $ids; do
    echo "Deleting deployment $id..."
    curl -X DELETE -s -H "Authorization: token ${PATOKEN}" \
        "https://api.github.com/repos/${GHUSER}/${GHREPO}/deployments/$id"
    echo "Deleted deployment $id."
done
