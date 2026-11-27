import { GoogleLogin } from '@react-oauth/google'

interface GoogleAuthButtonProps {
  onAuthenticate: (credential: string) => void
  onError: (message: string) => void
}

export function GoogleAuthButton({ onAuthenticate, onError }: GoogleAuthButtonProps) {
  return (
    <div className="google-login-button">
      <GoogleLogin
        onSuccess={(response) => {
          if (!response.credential) {
            onError('Google không trả về thông tin xác thực hợp lệ.')
            return
          }
          onAuthenticate(response.credential)
        }}
        onError={() => onError('Không thể mở hoặc hoàn tất đăng nhập Google. Vui lòng thử lại.')}
        useOneTap
        text="continue_with"
        theme="outline"
        shape="rectangular"
        size="large"
        width="360"
      />
    </div>
  )
}
