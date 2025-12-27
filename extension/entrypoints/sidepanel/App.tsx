function App() {
  const handleClick = () => {
    console.log("Button clicked!");
  };

  return (
    <div className="p-8">
      <button
        onClick={handleClick}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
      >
        Click Me
      </button>
    </div>
  );
}

export default App;
