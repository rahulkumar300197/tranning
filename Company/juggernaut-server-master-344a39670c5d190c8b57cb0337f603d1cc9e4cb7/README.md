# CL API Base Project v2

The base project is based on modular plugin-based approach with the following **objectives** -

     1. To improve productivity
     2. To attain quality and code standardization
     3. To improve modularity for better testing and auditing
     4. Creation of standalone modules pattern to provide uniformity
     5. To have in-built integrations and act as a base repo of code
     6. To have a code and flow unification for all developers
     7. To have proper loggings and comments
     8. To act as a base for further development

### Organisation of the Project

* Project is based on modules and plugins, where plugins are standard Hapi plugins and modules are custom plugins which provide a set of functionalities. Modules are composed of a collection of components. For example, plugins such as `"hapi-swagger"` are standard plugins and modules such as `“booking”` act as custom plugins or modules.

* In the overall architecture of the project, modules are separated into different folders acting as custom plugins with declared dependencies on other modules. For example, modules such as `“admin”` and `“booking”` are dependent on the `“auth”` module with a dependency declared in the `“index.js”` files of these modules.

![](https://image.ibb.co/hhAYoF/Screen_Shot_2017_06_09_at_12_46_06_PM.png)

* At the root of project there is an `index.js` file which uses the npm module `glue` to export the compose function. This compose function is then required into the `server.js` file.

* In the server folder there is a `config.js` file, which provides Confidence based configuration for the entire server. For example, project name and port number of the server.

* There also exists the `manifest.js` file which is the most important file in the project. All the server composition parameters, such as debug, cache and cors, are defined in the Confidence document in this file. This file is also responsible for registering all the plugins and modules. Registration is also performed based on pattern matching, where files ending with certain names are registered automatically.

![](https://image.ibb.co/kd668F/Screen_Shot_2017_06_09_at_12_46_23_PM.png)

* All the modules are organised into different folders inside the server folder. The modules are separated into different components based on the logical usability. Configuration of the modules is described in Confidence documents in files ending with `‘-config.js’` suffix. Data access services are defined in the `‘-service.js’` suffix file. Mongoose models are defined in files ending with `‘-model.js’` suffix. Business logic is defined in files ending with `‘-controller.js’` suffix. Routes are in `‘index.js’` file.

![](https://image.ibb.co/iCqBav/Screen_Shot_2017_06_09_at_12_46_36_PM.png)

* With the exception of the `‘index.js’` file and script files (in some cases), all other components of a module are automatically registered using the global patterns defined in the `‘manifest.js’` file. The `‘index.js’` file and script files have to registered manually in the `‘manifest.js’` file.

![](https://image.ibb.co/kvEtoF/Screen_Shot_2017_06_09_at_12_46_44_PM.png)

* Automatic registration is achieved by the registration of files in the `‘core’` sub-folder in the `‘server’` folder. These files, each one of them separately, look for files having a unique suffix pattern (for example, `‘-config’` suffix) and expose them on the plugin as a key (for example, exposing `‘AppConfiguration’` on `‘core-config’` plugin).

* Other than the functionality provided by the custom plugins defined as module folders, the standard Hapi plugins are also plugged in the `‘manifest.js’` file.

![](https://image.ibb.co/bWgjvv/Screen_Shot_2017_06_09_at_12_46_55_PM.png)

### How to get started?

1. Define `.env` file in root folder with the following text -
    ```sh
    NODE_ENV=development
    MONGO_DEBUG=true
    ```

2. Run the project using the following command -
    ```sh
    npm start
    ```

3. For any new functionality, create a new folder (as a plugin of Hapi) with the following structure -
    ```sh
    Folder             // Must be a unique name
    -- index.js        // Hapi plugin main file
    -- xxx-model.js    // Create mongo models with -model.js ext
    -- xxx-config.js    // Create config file with -config.js ext
    -- xxx-service.js  // create services with -service.js ext
    -- xxx-controller.js // create cntrls with -controller.js ext
    ```

4. Every model, service, controller, config and utility functions are plugged in with server at initialization. They can be accessed in the following way -

    Accessing the ‘User’ model -
    ```javascript
      const models = server.plugins['core-models'];
      const userModel = models['User'];
    ```

    Accessing the ‘User’ service -
    ```javascript
      const services = server.plugins['core-services'];
      const userService = services['UserService'];
    ```

    Accessing the ‘logger’ service -
    ```javascript
      winstonLogger.info('This is info')
    ```

    Accessing the ‘User’ controller -
    ```javascript
      const controllers = server.plugins['core-controller'];
      controllers.UserController.userRegister();
    ```

    Accessing the ‘application’ config -
    ```javascript
      const config = server.plugins['core-config'];           
      config.AppConfiguration.get("/STATUS_MSG/ERROR/INVALID_TOKEN")
    ```

5. Follow the following naming conventions -
    ```
    folder name     : video-upload-stream
    controller file : video-upload-stream-controller
    config          : video-upload-stream-config
    model           : video-upload-stream-model
    ```
##FEATURE RELEASE FOR JUGGERNAUT-SERVER V-2.1.0 (17-07-2017)
```
      1. Tracking Module
      2. Review and Rating System

    Minor Bug Fixes
      1. Mobile OTP verification flow
      2. Booking module dependency on admin
      3. No Registration type defined in SP /CP /User
      4. Plugin service providers missing dependency users in connection
      5. Session Update Bug
      6. Authorization file changed
```
##FEATURE RELEASE FOR JUGGERNAUT-SERVER V-2.0.0 (06-07-2017)

```
Async Awaits
```

##FEATURE RELEASE FOR JUGGERNAUT SERVER-V1.6 (23-06-2017)

###FEATURE ADDITION

```
  1. Scheduling with Service
  2. Matching
  3. ES Lint with Airbnb
  4. Role and User management (ACL)
  5. OTP Expiration
  6. SP Availability for service
  7. Admin Default settings
  8. Username Functionality
  9. Upload Documents
  10. Rate Limiting
  11. Delete Phone Number
  12. Booking Request to Specific SP
  13. Multilingual Email Template
  14. Role mapping from Model
  15. Logs Rotation
  16. ER Diagram of Base Project
  17. Error Logger Middleware

```
## FEATURE RELEASE FOR BACK-END BASE-PROJECT-V1.5 (26-05-2017)

### FEATURE ADDITION

```
  1. Service management
  2. Admin monthly and daily account

```
##FEATURE RELEASE FOR BACK-END BASE-PROJECT-V1.4 (19-05-2017)

###FEATURE ADDITION

```
  1. ES Lint
  2. Time Zone Offset
  3. Pagination
  4. Contact Us
  5.PayPal
  6.Project support SSL
  7.Push Notification

```
##FEATURE RELEASE FOR BACK-END BASE-PROJECT-V1.3 (18-05-2017)

###FEATURE ADDITION

```
  1. Stripe Pay
  2. Socket Integration
  3. Multilingual
  4. Admin Dashboard Count

```

## Release Notes 1.2.0(2017-04-07)
```
    1.  Twilio call module
    2.  Sockets Event and notification Module
    3.  Stripe-pay Module
    4.  Stripe-Connect Module
    5.  User Block/Unblock By admin
    6.  User Verification By Admin
    7.  Socket Events and Notifications Module
    8.  Logger implementation
    9.  Hard delete User Functionality from email
    10. Script Reminder For Unverified User
    11. Driver Search By Customer

 ```


## Release Notes 1.1.1(2017-03-31)

### Features
```
    1. Disable Swagger in Production env
    2. Boom implementation

```
### Fixes
```
   1. Removal Of Prechecks from index file.
   2. Code Optimisation.
   3. Removal of harcoded messages.
```

## Release Notes 1.1.0(2017-03-30)
```
    1. Winston Logging plugin
    2. Video watermark utility
    3. Video upload to S3 bucket and streaming from cloutFront
    4. OpenTok video calling utility
    5. Excel sheet parsing to specific location
    6. S3 bucket file upload plugin
    7. Admin panel
    8. Complete user management with config control
    9. JWT auth strategy
    10. OTP implementation
    11. Node-mailer plugin
    12. Push notifications for android and IOS
    13. JSDoc based documentation
    14. Confidence bases Configurations
    15. App version plugin
    16. Twilio sms module
```

###  Commenting using JSDoc
```
    documentation in the project is implemented using JSDoc module.
```

## Steps to generated docs
```
    1. npm install jsdoc -g
    2. ./node-modules/.bin/jsdoc -r <target-path> -d <destination-folder>
```
