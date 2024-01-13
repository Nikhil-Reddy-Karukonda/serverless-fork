# Serverless AWS Lambda Function :cloud:

## AWS Lambda Function - Serverless :zap:

This Lambda function is designed to handle events triggered by an Amazon Simple Notification Service (SNS) topic. Its main purpose is to process messages received from the SNS topic, usually involving information about assignment submissions in an educational context.

### Other Repositories
- Web Application: [GitHub - Webapp](https://github.com/Nikhil-Reddy-Karukonda/webapp)
- IAC Pulumi: [GitHub - IAC Pulumi](https://github.com/Nikhil-Reddy-Karukonda/iac-pulumi)

## 📋 Functionality Overview

### 1. **Environment Variables Setup:** :gear:
   - The function retrieves crucial configuration parameters from environment variables. This includes Google Cloud Storage credentials, the S3 bucket name, SMTP (Simple Mail Transfer Protocol) server details for sending emails, and the DynamoDB table name.

### 2. **SNS Message Processing:** :envelope_with_arrow:
   - Upon receiving an event from the SNS topic, the Lambda function extracts the SNS message payload and processes the JSON payload from these messages, which contain details about submission.

### 3. **File Handling:** :file_folder:
   - The function downloads a ZIP file from the provided URL, extracts its contents, and saves them to the `/tmp/` directory. The extracted files are then uploaded to Google Cloud Storage (GCS) under a specified folder structure.

### 4. **Email Notification:** :email:
   - Based on the submission's success or failure, an email is composed and sent to the submitter. The email includes details such as the submission status, relevant messages, and file paths.

### 5. **DynamoDB Integration:** :ledger:
   - If the submission is successful, the Lambda function updates a DynamoDB table with information regarding the submission. This includes details like the user's email, assignment ID, submission URL, file path, and timestamp.

### 6. **Error Handling:** :warning:
   - The function includes error handling mechanisms to catch and log exceptions that might occur during the processing of SNS messages or other operations.

## 🔧 Environment Variables

- `privateKey`: Base64-encoded Google Cloud Service Account JSON key file.
- `bucketName`: Name of the Google Cloud Storage bucket.
- `DynamoDBName`: Name of the DynamoDB table for storing submission information.
- `MAILGUN_API_KEY`: API key for the Mailgun email service.
- `emailCC`: Email CC address for sending notifications.

## 🚀 Usage

### 1. **Google Cloud Storage Setup:** :cloud:
   - Ensure the GCS bucket, as specified in the `bucketName` environment variable, exists and is accessible by the service account.

### 2. **DynamoDB Setup:** :construction:
   - Create a DynamoDB table according to the `DynamoDBName` variable with the necessary attributes to store submission information.

### 3. **Lambda Trigger Setup:** :triangular_flag_on_post:
   - Configure an SNS topic to trigger this Lambda function with the appropriate message format.

### 4. **Environment Variable Configuration:** :wrench:
   - Set all necessary environment variables in the Lambda function's configuration.

## 📝 Notes

- Ensure the Lambda function has the necessary permissions to access GCS, SMTP, and DynamoDB.

## 💻 📧 Implementing the Lambda Function

The Lambda function is triggered by an SNS notification and is responsible for:
- Downloading releases from GitHub repositories to GCS.
- Emailing users about the status of the download (email detailing the submission status and paths in the GCS bucket for both successful and failed scenarios).
- Tracking sent emails in DynamoDB for auditing purposes.
- Monitor CloudWatch Logs - Lambda function execution.
