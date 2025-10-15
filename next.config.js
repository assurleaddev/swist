/** @type {import('next').NextConfig} */
const nextConfig = {
  // Since we are now using local images from the 'public' directory for the vehicles,
  // we no longer need to specify any remotePatterns for 'placehold.co'.
  // This images object can be left empty or removed entirely if no other remote images are used in the project.
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;

