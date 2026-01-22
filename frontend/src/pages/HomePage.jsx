const HomePage = ({ location }) => {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">
        Welcome to BusPulse 🚍
      </h1>

      <p className="mt-2 text-sm text-[#5F6F68]">
        {location
          ? "Using your current location"
          : "Location not enabled"}
      </p>
    </div>
  );
};

export default HomePage;
