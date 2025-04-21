# Deployment Guide for GPT Backrooms

This guide explains how to properly deploy the GPT Backrooms application to Render.com.

## Prerequisites

- A Render.com account
- Your OpenAI API key with access to required models

## Deployment Steps

### 1. Connect Your GitHub Repository

1. Log in to your Render dashboard
2. Click "New" and select "Web Service"
3. Connect your GitHub repository
4. Select the repository containing the GPT Backrooms code

### 2. Configure the Web Service

Fill in the following settings:

- **Name**: `gpt-backrooms` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose the region closest to your users
- **Branch**: `main` (or your main branch name)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3. Add Environment Variables

Add the following environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key
- `NODE_ENV`: `production`

### 4. Deploy

Click "Create Web Service" and wait for the deployment to complete.

## Verifying Deployment

Once deployed, visit your Render URL (e.g., https://gpt-backrooms.onrender.com) and you should see:

1. The GPT Backrooms interface
2. AI models beginning their conversation
3. System logs appearing periodically

## Troubleshooting

If you see only "GPT Backrooms Server Running" text:
- Check that you've committed all frontend files
- Ensure the server is correctly configured to serve static files
- Check browser console for any errors

If you see no conversation starting:
- Check server logs for API key or rate limit issues
- Ensure Socket.IO connection is working properly
