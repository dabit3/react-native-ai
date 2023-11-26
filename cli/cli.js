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

const repoUrl = 'git@github.com:dabit3/react-native-ai.git'

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
      message: 'Configure environment variables?',
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
  
    let envs = `
# environment, either PRODUCTION or DEVELOPMENT
ENVIRONMENT="PRODUCTION"

# ByteScale
BYTESCALE_API_KEY=""

# OpenAI
OPENAI_API_KEY=""

# Anthropic
ANTHROPIC_API_KEY=""

# Cohere
COHERE_API_KEY=""

# FAL
FAL_API_KEY=""
`

    if (withEnv === 'yes') {
      console.log('Get OpenAI API Key at https://platform.openai.com/')
      const openai_api_key = await input({ message: "OpenAI API Key" })

      console.log('Get Fal API Key at https://www.fal.ai/')
      const fal_api_key = await input({ message: "Fal API Key" })
      
      console.log('Get Anthropic API Key at https://console.anthropic.com/')
      const anthropic_api_key = await input({ message: "Anthropic API Key" })

      console.log('Get Cohere API Key at https://cohere.com/')
      const cohere_api_key = await input({ message: "Cohere API Key" })

      console.log('Get Bytescale API Key at https://bytescale.com/')
      const bytescale_api_key = await input({ message: "Bytescale API Key" })
      
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
`
    }

    log(`\nInitializing project. \n`)

    spinner.start()
    await execa('git', ['clone', repoUrl, appName])
    await execa('rm', ['-r', `${appName}/cli`])
    await execa('rm', [`${appName}/rnaiheader.png`])
    await execa('rm', [`${appName}/screenzzz.png`])

    let packageJson = fs.readFileSync(`${appName}/server/package.json`, 'utf8')
    const packageObj = JSON.parse(packageJson)
    packageObj.name = appName
    packageJson = JSON.stringify(packageObj, null, 2)
    fs.writeFileSync(`${appName}/server/package.json`, packageJson)

    let packageJson2 = fs.readFileSync(`${appName}/app/package.json`, 'utf8')
    const packageObj2 = JSON.parse(packageJson)
    packageObj.name = appName
    packageJson = JSON.stringify(packageObj2, null, 2)
    fs.writeFileSync(`${appName}/app/package.json`, packageJson2)
    fs.writeFileSync(`${appName}/server/.env`, envs)

    process.chdir(path.join(process.cwd(), `${appName}/server`))
    spinner.text = ''
    let startCommand = ''

    if (isBunInstalled()) {
      spinner.text = 'Installing server dependencies'
      await execaCommand('bun install').pipeStdout(process.stdout)
      spinner.text = ''
      startCommand = 'bun dev'
      console.log('\n')
    } else if (isYarnInstalled()) {
      await execaCommand('yarn').pipeStdout(process.stdout)
      startCommand = 'yarn dev'
    } else {
      spinner.text = 'Installing server dependencies'
      await execa('npm', ['install', '--verbose']).pipeStdout(process.stdout)
      spinner.text = ''
      startCommand = 'npm run dev'
    }
    
    process.chdir('../')
    process.chdir(path.join(process.cwd(), `app`))

    console.log('cwd:', process.cwd())

    spinner.text = ''
    startCommand = ''

    if (isBunInstalled()) {
      spinner.text = 'Installing app dependencies'
      await execaCommand('bun install').pipeStdout(process.stdout)
      spinner.text = ''
      startCommand = 'bun dev'
      console.log('\n')
    } else if (isYarnInstalled()) {
      await execaCommand('yarn').pipeStdout(process.stdout)
      startCommand = 'yarn dev'
    } else {
      spinner.text = 'Installing app dependencies'
      await execa('npm', ['install', '--verbose']).pipeStdout(process.stdout)
      spinner.text = ''
      startCommand = 'npm run dev'
    }
    spinner.stop() 
    log(`${green.bold('Success!')} Created ${appName} at ${process.cwd()} \n`)
    log(`To get started, change into the new directory and run ${chalk.cyan(startCommand)}`)
  } catch (err) {
    console.log('eror:', err)
    log('\n')
    if (err.exitCode == 128) {
      log('Error: directory already exists.')
    }
    spinner.stop()
  }
}
main()