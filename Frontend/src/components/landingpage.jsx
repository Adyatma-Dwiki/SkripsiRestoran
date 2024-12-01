const landingPage = () => {
    return (
        <>
            <div id="Home" className="relative w-screen h-screen bg-cover bg-center" style={{ backgroundImage: "url('/path/to/your/restaurant-image.jpg')" }}>
                <div className="absolute inset-0 bg-black opacity-50"></div>
                <div className="relative z-10 text-white flex items-center justify-between h-full container mx-auto">
                    <div className="text-left space-y-4 max-w-md">
                        <h1 className="text-4xl font-bold">Selamat Datang di Restoran Resto</h1>
                        <p className="text-lg">Nikmati hidangan lezat dan pengalaman tak terlupakan hanya di Restoran Resto.</p>
                    </div>
                    <div className="text-right text-4xl font-extrabold">
                        <h1>Restoran Resto</h1>
                    </div>
                </div>
            </div>

        </>
    );

}

export default landingPage;