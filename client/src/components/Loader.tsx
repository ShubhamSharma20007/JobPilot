const Loader = () => {
  return (
    <div role="status" aria-label="Loading" className="relative min-h-[calc(100vh-4rem)] w-full">
      <div className="loader">
        <div className="square" id="sq1"></div>
        <div className="square" id="sq2"></div>
        <div className="square" id="sq3"></div>
        <div className="square" id="sq4"></div>
        <div className="square" id="sq5"></div>
        <div className="square" id="sq6"></div>
        <div className="square" id="sq7"></div>
        <div className="square" id="sq8"></div>
        <div className="square" id="sq9"></div>
      </div>
    </div>
  )
}

export default Loader