import backgroundImage from '../images/BackgroundImage.jpeg';

const LandingPage = () => {
  return (
    <>
      <div
        id="Home"
        className="relative w-screen h-screen bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        {/* Overlay transparan */}
        <div className="absolute inset-0 bg-black opacity-50"></div>

        {/* Konten utama */}
        <div className="relative z-10 text-white flex flex-col lg:flex-row items-center justify-center lg:justify-between h-full container mx-auto p-5">
          <div className="text-center lg:text-left space-y-4 max-w-md mb-8 lg:mb-0">
            <h1 className="text-2xl md:text-4xl font-bold">
              Selamat Datang di Rumah Tamah
            </h1>
            <p className="text-sm md:text-lg">
              Nikmati hidangan lezat dan pengalaman belajar berbahas isyarat.
            </p>
          </div>
          <div className="text-center lg:text-right text-2xl md:text-4xl font-extrabold">
            <h1>Resto Rumah Tamah</h1>
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingPage;
