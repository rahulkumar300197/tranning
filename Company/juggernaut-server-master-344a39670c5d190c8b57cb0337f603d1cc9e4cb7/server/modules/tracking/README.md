#Description:-

This plugin is to implement the tracking functionality for driver into the CL API BASEPROJECT_V2.

=> Key Features :
- update driver location, through API or through socket and emit updated location to admin
- delete above driver tracking data after certain number of days as set by admin default settings
- update driver location associated with a booking and emit current location to all participants of booking and   admin
- upload json file with complete route to S3 bucket.

#Dependencies:-
    1. bootstrap
    2. auth
    3. core-controller
    4. core-config
    5. core-services
    6. core-utility-functions

=> Modules :
    1. joi
    2. boom


#How to Use:-

1. install required Modules.
  1.1 -> command to install
      -> npm install <module-name> --save

2. Register the tracking/index and tracking/tracking-script file in server/manifest.js
