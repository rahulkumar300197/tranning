#Description:-

This plugin is used to implement payments functionality using stripe in the project.

#Dependencies:-
   1. core-config
   2. core-controller
   3. core-utility-functions

=> Modules Required :-
   1. confidence
   2. boom
   3. stripe
   4. joi


#important-note
  1. Stripe APIs are intended to be used inside other modules controller functions.

#How to Use:-

1. install required Modules.
    1.1 -> command to install.
        -> npm install <module-name> --save

2. Register the stripe-payments/index file in server/manifest.js
3. insert your Stripe-secret-key in stripe-config file.
