module.exports = {
  apps: [
    {
      name: "meat-bot",
      script: "npx",
      args: "tsx src/bot/index.ts",
      cwd: "/opt/meat-bot",
      interpreter: "bash",
    },
    {
      name: "git-auto-deploy",
      script: "/opt/gitautodeploy-venv/bin/python",
      args: "-m gitautodeploy --config /etc/git-auto-deploy/config.json --allow-root-user",
    },
  ],
};
