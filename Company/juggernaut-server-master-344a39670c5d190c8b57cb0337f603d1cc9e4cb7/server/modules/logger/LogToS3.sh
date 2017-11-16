#!/bin/bash

S3KEY=$1
S3SECRET=$2
s3Link=$4
bucket=$3
echo $1, $2, $3, $4
function putS3
{
  path=./log
  oldDate=$(date +%Y-%m-%d -d "7 day ago") 
  file=$oldDate-"results.log"
  aws_path=/baseLog/
  date=$(date +"%a, %d %b %Y %T %z")
  acl="x-amz-acl:public-read"
  content_type='application/x-compressed-tar'
  string="PUT\n\n$content_type\n$date\n$acl\n/$bucket$aws_path$file"
  signature=$(echo -en "${string}" | openssl sha1 -hmac "${S3SECRET}" -binary | base64)
  curl -X PUT -T "$path/$file" \
    -H "Host: $bucket.s3.amazonaws.com" \
    -H "Date: $date" \
    -H "Content-Type: $content_type" \
    -H "$acl" \
    -H "Authorization: AWS ${S3KEY}:$signature" \
    "https://$bucket.s3.amazonaws.com$aws_path$file"
}

for file in $path/; do
echo $path
  putS3 "$path" "${file##*/}" "$s3Link"
done
if [ $? -eq 0 ]; then
    echo OK
	find $path/$file -exec rm {} \;
else
    echo FAIL
fi