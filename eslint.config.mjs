import nextConfig from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [".next/", "node_modules/", "next-env.d.ts", "public/", ".claude/"],
  },
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
