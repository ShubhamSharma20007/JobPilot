import os
from fastapi import APIRouter, Depends, HTTPException,status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
from sqlalchemy.orm import Session
from config.cookiOptions import COOKIE_OPTIONS
from config.config import config
from database.db import get_db
from models.user_model import User
from schemas.user_schema import UserResponse
from utils.jwt import create_access_token
from fastapi.encoders import jsonable_encoder
router = APIRouter()


class TokenVerification(BaseModel):
    token: str


@router.post("/google/verify",status_code=status.HTTP_200_OK)
def verify_google_token(body: TokenVerification, db: Session = Depends(get_db)):
    try:
        # 1. Verify the Google token
        request = requests.Request()
        user_info = id_token.verify_oauth2_token(
            id_token=body.token,
            request=request,
            audience=config["GOOGLE_CLIENT_ID"],
            clock_skew_in_seconds=10,
        )

        google_id = user_info.get("sub")
        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")

        # 2. Check if user already exists
        user = db.query(User).filter(User.google_id == google_id).first()
        if not user:
          user = db.query(User).filter(User.email == email).first()
          if user:
            user.google_id = google_id
            db.commit()
            db.refresh(user)

        if not user:
   
            user = User(
                email=email,
                name=name,
                picture=picture,
                google_id=google_id,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # 4. Generate JWT
        access_token = create_access_token({
            "sub": str(user.id),
            "email": user.email,
            "name": user.name,
        })

     
        user_data = UserResponse.model_validate(user)
        
        
        response = JSONResponse(
            content=jsonable_encoder(user_data)
        )
        response.set_cookie(
            **COOKIE_OPTIONS,
            value=access_token,
        )
        return response

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
