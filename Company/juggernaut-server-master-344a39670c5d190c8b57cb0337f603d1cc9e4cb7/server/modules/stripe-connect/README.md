#Description:-

This plugin is used to implement payments functionality using stripe-connect in the project.

#Dependencies:-
   1. core-services
   2. core-config
   3. core-controller
   4. core-utility-functions

=> Modules Required :-
   1. confidence
   2. moment
   3. fs
   4. joi
   5. boom
   6. joi-date-extensions
   7. stripe

#important-note
  1. Stripe Api are intended to be used inside other modules controller functions.

#How to Use:-

1. install required Modules.
    1.1 -> command to install.
        -> npm install <module-name> --save

2. Register the stripe-connect/index file in server/manifest.js
3. insert your Stripe-secret-key in stripe-config file.
