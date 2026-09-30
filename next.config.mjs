const nextConfig = {
  async redirects() {
    return [
      {
        source: "/ledgervision_mobile_dashboard_prototype.html",
        destination: "/",
        permanent: false,
      },
      {
        source: "/ledgervision_app.html",
        destination: "/mobile",
        permanent: false,
      },
    ];
  },
};
export default nextConfig;
