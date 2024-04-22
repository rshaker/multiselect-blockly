exit 0

# This deletes a single workflow run by ID
curl -X DELETE -H "Authorization: token ${PATOKEN}" \
"https://api.github.com/repos/rshaker/multiselect-blockly/actions/runs/7171186325"

export GHUSER=rshaker
export GHREPO=multiselect-blockly
# export PATOKEN=see_password_vault

# This deletes the last 500 workflow runs
gh run list --workflow=deploy-playground-test.yml --limit 500 | cut -f 7 | sed -e 's/\(.*\)/ curl -X DELETE -H "Authorization: token '$PATOKEN'" "https:\/\/api.github.com\/repos\/'$GHUSER'\/'$GHREPO'\/actions\/runs\/\1"/' | bash

# The is the multi-line version of "last 500"
gh run list --workflow=deploy-playground-test.yml --limit 500 | cut -f 7 | \
sed -e "s/\(.*\)/curl -X DELETE -H 'Authorization: token ${PATOKEN}' \
'https:\/\/api.github.com\/repos\/${GHUSER}\/${GHREPO}\/actions\/runs\/\1'/" | bash

# Example OUTPUT: pipe these to /bin/sh
curl -X DELETE -H 'Authorization: token see_password_vault' 'https://api.github.com/repos/rshaker/multiselect-blockly/actions/runs/8428208018'
curl -X DELETE -H 'Authorization: token see_password_vault' 'https://api.github.com/repos/rshaker/multiselect-blockly/actions/runs/8428202710'

~/repos/multiselect-blockly % gh run list
STATUS  NAME                        WORKFLOW                                               BRANCH  EVENT  ID          ELAPSED  AGE
✓       Increment version to 0.2.6  Deploy plugin test/playground and test/workspace t...  main    push   8428208018  2m28s    18h
✓       Increment version to 0.2.5  Deploy plugin test/playground and test/workspace t...  main    push   8428202710  1m34s    18h

# Managing deployments (how to delete)

https://docs.github.com/en/rest/deployments/deployments?apiVersion=2022-11-28#list-deployments