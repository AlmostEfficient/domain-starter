const GradientButton = ({ loading, handleClick, label }) => {
  return (
    <button
      className="text-white bg-gradient-to-br from-green-400 to-blue-600 disabled:text-gray-400 disabled:from-green-600 disabled:to-blue-800 hover:bg-gradient-to-bl disabled:hover:bg-gradient-to-br disabled:cursor-not-allowed w-56 font-medium rounded-lg text-xl px-5 py-2.5 text-center mt-8"
      disabled={loading}
      onClick={handleClick}
    >
      {label}
    </button>
  );
};

export default GradientButton;
