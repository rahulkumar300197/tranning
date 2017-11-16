# video upload and stream plugin

#Description:-

This plugin is used to upload videos to s3 bucket and stream using cloudFront.

#Dependencies:-
   1. core-services
   2. core-controller
   3. core-models
   4. core-utility-functions



=> Modules Required :-
   1. aws-sdk
   2. joi
   3. s3-upload-stream
   4. fs
   5. boom
   6. video-upload-stream-constants

## How to Use:-

   1. install required Modules.
      1.1 -> command to install.
          -> npm install <module-name> --save

   2. Register the video-upload-stream/index file in server/manifest.js

   3.  Add aws credentials accessKeyId, secretAccessKey, bucket name in awsCredentials file to access aws services.

   4.  Create S3 bucket in aws to store videos.

   5.  Set videoPartMaxSize, concurrentParts in video-constants file as per need.

   6.  Create a CloudFront web distribution domain name at aws

   7.  Add cloudFrontDomainName to awsCredentials file

   8. Access videoCloudFrontURL of all the uploaded videos to S3 bucket from path /videoURLs to stream the
    videos.
