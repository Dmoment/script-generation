# S3 Bucket Setup for Script File Storage

This guide will walk you through creating an S3 bucket and configuring it for use with ActiveStorage.

## Prerequisites

- AWS Account
- AWS CLI installed (optional, but recommended)
- IAM user with S3 permissions

## Step 1: Create S3 Bucket

### Option A: Using AWS Console

1. **Log in to AWS Console**
   - Go to https://console.aws.amazon.com/
   - Sign in with your AWS account

2. **Navigate to S3**
   - Search for "S3" in the services search bar
   - Click on "S3" service

3. **Create Bucket**
   - Click "Create bucket" button
   - **Bucket name**: Choose a unique name (e.g., `script-generation-production`, `script-generation-development`)
     - Note: Bucket names must be globally unique across all AWS accounts
     - Use lowercase letters, numbers, and hyphens only
   - **AWS Region**: Choose your preferred region (e.g., `us-east-1`, `us-west-2`)
     - Note: Keep this region name for configuration later

4. **Configure Bucket Settings**
   - **Object Ownership**: Choose "ACLs disabled (recommended)" or "Bucket owner preferred"
   - **Block Public Access**: 
     - ✅ Block all public access (recommended for security)
     - Files will be accessed via signed URLs, not public URLs
   - **Bucket Versioning**: Enable if you want to keep file versions (optional)
   - **Default encryption**: Enable (recommended)
     - Choose "AWS managed keys (SSE-S3)" or "AWS KMS" based on your security needs
   - **Object Lock**: Disable (unless you need compliance features)

5. **Review and Create**
   - Review all settings
   - Click "Create bucket"

### Option B: Using AWS CLI

```bash
# Create bucket
aws s3 mb s3://script-generation-production --region us-east-1

# Enable versioning (optional)
aws s3api put-bucket-versioning \
  --bucket script-generation-production \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket script-generation-production \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

## Step 2: Create IAM User for Application Access

1. **Navigate to IAM**
   - Go to AWS Console → IAM (Identity and Access Management)

2. **Create User**
   - Click "Users" in the left sidebar
   - Click "Create user"
   - **User name**: `script-generation-s3-user` (or your preferred name)
   - **Access type**: Select "Programmatic access"
   - Click "Next: Permissions"

3. **Attach Policies**
   - Click "Attach policies directly"
   - Search for and select: `AmazonS3FullAccess` (for simplicity)
     - **OR** Create a custom policy with minimal permissions (see below)
   - Click "Next: Tags" (optional)
   - Click "Next: Review"
   - Click "Create user"

4. **Save Credentials**
   - **IMPORTANT**: Copy the following immediately (you won't see them again):
     - **Access Key ID**: `AKIA...` (starts with "AKIA")
     - **Secret Access Key**: `...` (long random string)
   - **Where to find them**: 
     - They appear on the final screen after creating the user
     - Click "Show" next to the Secret Access Key to reveal it
     - **Download the CSV file** (recommended) or copy both values manually
     - ⚠️ **Warning**: You can only see the Secret Access Key ONCE. If you lose it, you'll need to create a new access key.
   - Save these securely (you'll need them for Rails credentials)

### Custom IAM Policy (More Secure)

If you prefer minimal permissions, create a custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::script-generation-production",
        "arn:aws:s3:::script-generation-production/*"
      ]
    }
  ]
}
```

## Step 3: Configure CORS (Optional but Recommended)

If you need direct browser uploads or CORS access:

1. **Go to S3 Bucket**
   - Select your bucket
   - Click "Permissions" tab
   - Scroll to "Cross-origin resource sharing (CORS)"

2. **Add CORS Configuration**
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedOrigins": [
         "http://localhost:3000",
         "https://yourdomain.com"
       ],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```
   - Replace `yourdomain.com` with your actual domain
   - Click "Save changes"

## Step 4: Configure Rails Application

### 4.1: Add AWS Credentials to Environment Variables

**Where to get the credentials:**
1. After creating the IAM user (Step 2), you'll see a screen with:
   - **Access Key ID**: Starts with `AKIA...` (e.g., `AKIAIOSFODNN7EXAMPLE`)
   - **Secret Access Key**: Long random string (e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)
2. **Download the CSV file** or copy both values
3. ⚠️ **Important**: The Secret Access Key is only shown once. Save it immediately!

**Add to environment files:**

**For Development** (`.env.development.local`):
```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE  # Replace with your Access Key ID from Step 2
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  # Replace with your Secret Access Key from Step 2
AWS_REGION=us-east-1  # Replace with your bucket's region
AWS_S3_BUCKET=script-generation-development  # Replace with your bucket name
```

**For Production** (`.env.production` or your deployment platform's environment variables):
```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=script-generation-production
```

**Note**: The `.env.development.local` file is already in `.gitignore`, so your credentials won't be committed to git.

### 4.3: Update Storage Configuration

The `config/storage.yml` file is already configured. Verify it matches your bucket name:

```yaml
amazon:
  service: S3
  access_key_id: <%= Rails.application.credentials.dig(:aws, :access_key_id) %>
  secret_access_key: <%= Rails.application.credentials.dig(:aws, :secret_access_key) %>
  region: <%= ENV.fetch("AWS_REGION", "us-east-1") %>
  bucket: <%= ENV.fetch("AWS_S3_BUCKET", "script-generation-#{Rails.env}") %>
```

### 4.3: Run Migrations

```bash
# Run ActiveStorage migrations
rails db:migrate
```

## Step 5: Test the Setup

1. **Start Rails Console**
   ```bash
   rails console
   ```

2. **Test File Upload**
   ```ruby
   # Create a test file
   test_file = File.open(Rails.root.join("README.md"))
   
   # Create a script version (if you have one)
   version = ScriptVersion.first
   
   # Attach file
   version.file.attach(
     io: test_file,
     filename: "test.txt",
     content_type: "text/plain"
   )
   
   # Check if attached
   version.file.attached? # => true
   version.file.url # => Should return S3 URL
   ```

## Step 6: Bucket Lifecycle Policies (Optional)

To manage costs, you can set up lifecycle policies:

1. **Go to S3 Bucket → Management tab**
2. **Create lifecycle rule**
   - **Rule name**: `delete-old-versions`
   - **Rule scope**: Apply to all objects
   - **Actions**: 
     - Delete previous versions after 90 days
     - Delete incomplete multipart uploads after 7 days

## Troubleshooting

### Common Issues

1. **Access Denied Error**
   - Check IAM user permissions
   - Verify bucket name matches configuration
   - Check region matches

2. **Bucket Not Found**
   - Verify bucket name is correct
   - Check region matches
   - Ensure bucket exists in the correct AWS account

3. **CORS Errors**
   - Verify CORS configuration in S3
   - Check allowed origins match your domain

4. **Credentials Not Found**
   - Check that `.env.development.local` exists and contains all AWS variables
   - Verify environment variables are set in production
   - Restart your Rails server after adding environment variables

## Security Best Practices

1. **Never commit credentials to git**
   - Use Rails credentials or environment variables
   - Add `.env` to `.gitignore` (already done)

2. **Use IAM roles in production**
   - For EC2/ECS deployments, use IAM roles instead of access keys
   - More secure than storing credentials

3. **Enable bucket encryption**
   - Always enable server-side encryption
   - Use KMS for additional security if needed

4. **Set up bucket policies**
   - Restrict access to specific IPs if possible
   - Use bucket policies for fine-grained access control

5. **Enable CloudTrail**
   - Monitor S3 access and changes
   - Set up alerts for suspicious activity

## Cost Optimization

1. **Use S3 Intelligent-Tiering**
   - Automatically moves files to cheaper storage classes
   - Good for files with unknown access patterns

2. **Set up lifecycle policies**
   - Move old files to Glacier for archival
   - Delete old versions automatically

3. **Enable compression**
   - Compress files before upload when possible
   - Reduces storage and transfer costs

## Next Steps

After completing these steps:

1. Run `bundle install` to install the `aws-sdk-s3` gem
2. Run `rails db:migrate` to create ActiveStorage tables
3. Test file uploads through your application
4. Monitor S3 usage in AWS Console

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [ActiveStorage Overview](https://guides.rubyonrails.org/active_storage_overview.html)
- [Rails Credentials Guide](https://guides.rubyonrails.org/security.html#custom-credentials)

