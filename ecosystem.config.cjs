module.exports = {
  apps: [
    {
      name: 'meat-bot',
      cwd: '/opt/meat-bot',
      script: 'bash',
      args: '-c "npx tsx src/bot/index.ts"',
      interpreter: 'none'
    },
    {
      name: 'git-auto-deploy',
      script: '/opt/gitautodeploy-venv/bin/python',
      args: '-m gitautodeploy --config /etc/git-auto-deploy/config.json --allow-root-user',
      interpreter: 'none'
    }
  ]
}
