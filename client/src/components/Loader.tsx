import { useState } from "react"

const DELAYS = [0, 75, 150, 225, 300, 375, 450, 525, 600]
const PERIOD = 1350 

const Loader = () => {

  const [now] = useState(() => performance.now())

  return (
    <div role="status" aria-label="Loading" className="relative min-h-[calc(100vh-4rem)] w-full">
      <div className="loader">
        {DELAYS.map((d, i) => (
          <div
            key={i}
            id={`sq${i + 1}`}
            className="square"
           
            style={{ animationDelay: `${((((d - now) % PERIOD) + PERIOD) % PERIOD) - PERIOD}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export default Loader