#Description:-

This plugin is to implement the management of roles into the CL API BASEPROJECT_V2.
The app-roles-script initializes the roles collection , if already not present in the database.

#Dependencies:-
    1. bootstrap
    2. core-controller
    3. core-config
    4. core-services
    5. core-utility-functions

=> Modules :
    1. joi
    2. boom
    3. confidence
    4. dotenv
    5. fs



#How to Use:-

1. install required Modules.
   1.1.-> command to install
          npm install <module-name> --save

2. Register the role-manager/index and the role-manager/app-roles-script file in server/manifest.js
