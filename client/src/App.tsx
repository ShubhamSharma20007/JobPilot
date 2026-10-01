import { GoogleLogin } from '@react-oauth/google';
import { authService } from "./services/auth.service";

async function handleGoogleLogin(credentialResponse) {
  if (credentialResponse.credential) {
    try {
      const data = await authService.verifyToken(credentialResponse.credential);
      console.log("Logged in user:", data);
     
    } catch (error) {
      console.error("Token verification failed", error);
      alert("Failed to verify token on backend.");
    }
  }
}


const App = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <GoogleLogin
        onSuccess={handleGoogleLogin}
        onError={() => {
          console.error('Login Failed');
          alert("Login Failed");
        }}
      />
    </div>
  )
}

export default App;