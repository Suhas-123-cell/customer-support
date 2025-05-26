from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "a_very_secret_key_that_should_be_in_env_var"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 # 30 minutes
    DEMO_MODE: bool = True  # Enable demo mode for easier testing

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings() 