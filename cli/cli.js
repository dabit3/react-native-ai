#!/usr/bin/env node

import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import { Command } from 'commander'
import select from '@inquirer/select'
import { input } from '@inquirer/prompts';
import {execa, execaCommand} from 'execa'
import ora from 'ora'
import childProcess from 'child_process'

const log = console.log
const program = new Command()
const green = chalk.green

const repoUrl = 'https://github.com/dabit3/react-native-ai.git'

const isYarnInstalled = () => {
  try {
    childProcess.execSync('yarn --version');
    return true;
  } catch {
    return false; 
  }
}

const isBunInstalled = () => {
  try {
    childProcess.execSync('bun --version')
    return true;
  } catch(err) {
    return false; 
  }
}

async function main() {
  const spinner = ora({
    text: 'Creating codebase'
  })
  try {
    const kebabRegez = /^([a-z]+)(-[a-z0-9]+)*$/

    program
      .name('React Native AI')
      .description('Full Stack React Native Boilerplate for building streaming AI apps.')
  
    program.parse(process.argv)
  
    const args = program.args
    let appName = args[0]
  
    if (!appName || !kebabRegez.test(args[0])) {
      appName = await input({
        message: 'Enter your app name',
        default: 'rn-ai',
        validate: d => {
         if(!kebabRegez.test(d)) {
          return 'please enter your app name in the format of my-app-name'
         }
         return true
        }
      })
    }
  
    const withEnv = await select({
      message: 'Configure environment variables now?',
      choices: [
        {
          name: 'Yes',
          value: 'yes',
        },
        {
          name: 'No',
          value: 'no',
        }
      ]
    })
  
    let clientEnvs = `
EXPO_PUBLIC_ENV="DEVELOPMENT"

# Your development URL (localhost or ngrok)
EXPO_PUBLIC_DEV_API_URL="http://localhost:3050"

# Your production URL
EXPO_PUBLIC_PROD_API_URL="https://staging.example.com"
`

    let envs = `
# environment, either PRODUCTION or DEVELOPMENT
ENVIRONMENT="PRODUCTION"

# OpenAI https://platform.openai.com
OPENAI_API_KEY=""

# FAL AI https://www.fal.ai
FAL_API_KEY=""

# Anthropic (optional) https://console.anthropic.com
ANTHROPIC_API_KEY=""

# Cohere (optional) https://cohere.com
COHERE_API_KEY=""

# ByteScale secret (optional) https://bytescale.com
BYTESCALE_API_KEY=""

# Replicate secret (optional) https://replicate.com/
REPLICATE_KEY=""

# Gemini API Key (optional) https://makersuite.google.com
GEMINI_API_KEY=""
`

    if (withEnv === 'yes') {
      console.log('Get OpenAI API Key at https://platform.openai.com')
      const openai_api_key = await input({ message: "OpenAI API Key" })

      console.log('Get Fal API Key at https://www.fal.ai')
      const fal_api_key = await input({ message: "Fal API Key" })

      console.log('(optional) Get Anthropic API Key at https://console.anthropic.com')
      const anthropic_api_key = await input({ message: "Anthropic API Key" })

      console.log('(optional) Get Cohere API Key at https://cohere.com')
      const cohere_api_key = await input({ message: "Cohere API Key" })

      console.log('(optional) Get Bytescale API Key at https://bytescale.com')
      const bytescale_api_key = await input({ message: "Bytescale API Key" })

      console.log('(optional) Get Replicate API Key at https://replicate.com')
      const replicate_api_key = await input({ message: "Replicate API Key" })

      console.log('(optional) Get Gemini API Key at https://makersuite.google.com')
      const gemeni_api_key = await input({ message: "Gemini API Key" })

      envs = `
# environment, either PRODUCTION or DEVELOPMENT
ENVIRONMENT="PRODUCTION"

# ByteScale
BYTESCALE_API_KEY="${bytescale_api_key}"

# OpenAI
OPENAI_API_KEY="${openai_api_key}"

# Anthropic
ANTHROPIC_API_KEY="${anthropic_api_key}"

# Cohere
COHERE_API_KEY="${cohere_api_key}"

# FAL
FAL_API_KEY="${fal_api_key}"

# Replicate secret
REPLICATE_KEY="${replicate_api_key}"

# Gemini API Key
GEMINI_API_KEY=${gemeni_api_key}
`
    }

    log(`\nInitializing project. \n`)

    spinner.start()
    await execa('git', ['clone', repoUrl, appName])
    try {
      await execa('rm', ['-r', `${appName}/cli`])
      await execa('rm', ['-rf', `${appName}/.git`])
    } catch (err) {}

    let packageJson = fs.readFileSync(`${appName}/server/package.json`, 'utf8')
    const packageObj = JSON.parse(packageJson)
    packageObj.name = appName
    packageJson = JSON.stringify(packageObj, null, 2)
    fs.writeFileSync(`${appName}/server/package.json`, packageJson)

    let packageJson2 = fs.readFileSync(`${appName}/app/package.json`, 'utf8')
    const packageObj2 = JSON.parse(packageJson2)
    packageObj2.name = appName
    packageJson2 = JSON.stringify(packageObj2, null, 2)
    fs.writeFileSync(`${appName}/app/package.json`, packageJson2)
    fs.writeFileSync(`${appName}/server/.env`, envs)
    fs.writeFileSync(`${appName}/app/.env`, clientEnvs)

    process.chdir(path.join(process.cwd(), `${appName}/server`))
    spinner.text = ''
    let serverStartCommand = ''

    if (isBunInstalled()) {
      spinner.text = 'Installing server dependencies'
      await execaCommand('bun install').pipeStdout(process.stdout)
      spinner.text = ''
      serverStartCommand = 'bun dev'
      console.log('\n')
    } else if (isYarnInstalled()) {
      await execaCommand('yarn').pipeStdout(process.stdout)
      serverStartCommand = 'yarn dev'
    } else {
      spinner.text = 'Installing server dependencies'
      await execa('npm', ['install', '--verbose']).pipeStdout(process.stdout)
      spinner.text = ''
      serverStartCommand = 'npm run dev'
    }
    
    process.chdir('../')
    process.chdir(path.join(process.cwd(), `app`))

    spinner.text = ''
    let appStartCommand = ''

    if (isBunInstalled()) {
      spinner.text = 'Installing app dependencies'
      await execaCommand('bun install').pipeStdout(process.stdout)
      spinner.text = ''
      appStartCommand = 'bun start'
      console.log('\n')
    } else if (isYarnInstalled()) {
      await execaCommand('yarn').pipeStdout(process.stdout)
      appStartCommand = 'yarn start'
    } else {
      spinner.text = 'Installing app dependencies'
      await execa('npm', ['install', '--verbose']).pipeStdout(process.stdout)
      spinner.text = ''
      appStartCommand = 'npm start'
    }
    spinner.stop() 
    process.chdir('../')
    log(`${green.bold('Success!')} Created ${appName} at ${process.cwd()} \n`)
    log(`To get started, change into the server directory and run ${chalk.cyan(serverStartCommand)}\n`)
    log(`In a separate terminal, change into the app directory and run ${chalk.cyan(appStartCommand)}`)
  } catch (err) {
    log('\n')
    if (err.exitCode == 128) {
      log('Error: directory already exists.')
    }
    spinner.stop()
  }
}
main()