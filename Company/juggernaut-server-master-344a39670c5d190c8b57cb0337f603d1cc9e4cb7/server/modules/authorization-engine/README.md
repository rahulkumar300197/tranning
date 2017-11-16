#Description:-

This plugin is to implement the Authorization-middleware functionality into the Juggernaut-Server.

#Dependencies:-
    1. bootstrap
    2. auth
    3. core-controller
    4. core-config
    5. core-services
    6. core-utility-functions
    7. core-models
    8. RedisService

=> Modules :
    1. joi
    2. boom
    3. underscore
    4. fs
    5. redis

#How it works:-
    https://drive.google.com/file/d/0B1jbFMHzAMIHWjcwR2dMdnZJLXM/view?usp=sharing

#How to Use:-

1. install required Modules.
   1.1.-> command to install
          npm install <module-name> --save

2. Register the authorization-engine/index file in server/manifest.js
3. write permission for first time setup in authorization.json file or use api to do the same
    e.g  {
        "uniqueApiPath": "get/admin/getAllUsers",
        "roleAccess": [
            {
                "role": "admin",
                "completeAccess":true,
                "objectRights": [
                    "role:all",
                    "isBlocked:all",
                    "isAdminVerified:true"
                ]
            }
        ],
        "allowedToUpdate": [
            "admin"
        ]
    }
    a.) uniqueApiPath is combination of method type and api
    b.) roleAccess has an array of roles for specific permissions of individual roles, here role is role of user, completeAccess true will give complete rights on particular api and in case of fase role will be allowed to access only key:value pairs from object rights in case of get method whereas objectRights will have only key for the post methods
    e.g. "objectRights": [
                    "userName"
                ]
    c.) allowedToUpdate will be the role that can change the permissions of the particular api

  API's available for Authorization-Engine
1. /authorization/addPermission
2. /authorization/specificRolePermission
3. /authorization/getPermission
4. /authorization/getAllPermissions
