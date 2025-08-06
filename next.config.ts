import type { NextConfig } from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";

const nextConfig: NextConfig = {
  images: {
    domains: ["flowbite.com", "images.ctfassets.net", "kolhapur-police.s3.amazonaws.com"],
  },
  output: "standalone"
};

export default withFlowbiteReact(nextConfig);
