import os
import sys
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


@dataclass
class Config:
    api_key: str
    api_secret: str

    base_currency: str
    quote_currency: str

    bid_spread: float
    ask_spread: float
    order_amount: float
    order_refresh_seconds: int
    num_order_levels: int

    inventory_target_ratio: float
    inventory_skew_factor: float

    min_spread: float
    max_position_usdt: float
    daily_loss_limit_usdt: float
    seed_price: float

    volume_trade_interval_seconds: int
    volume_trade_amount_usdt: float

    log_level: str
    log_file: str

    @property
    def pair(self) -> str:
        return f"{self.base_currency}/{self.quote_currency}"


def load_config() -> Config:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(env_path)

    api_key = os.getenv("LATOKEN_API_KEY", "")
    api_secret = os.getenv("LATOKEN_API_SECRET", "")

    if not api_key or api_key == "your_api_key_here":
        print("ERROR: Set LATOKEN_API_KEY in pmm/.env")
        sys.exit(1)
    if not api_secret or api_secret == "your_api_secret_here":
        print("ERROR: Set LATOKEN_API_SECRET in pmm/.env")
        sys.exit(1)

    return Config(
        api_key=api_key,
        api_secret=api_secret,
        base_currency=os.getenv("BASE_CURRENCY", "MARS"),
        quote_currency=os.getenv("QUOTE_CURRENCY", "USDT"),
        bid_spread=float(os.getenv("BID_SPREAD", "0.015")),
        ask_spread=float(os.getenv("ASK_SPREAD", "0.015")),
        order_amount=float(os.getenv("ORDER_AMOUNT", "100")),
        order_refresh_seconds=int(os.getenv("ORDER_REFRESH_SECONDS", "60")),
        num_order_levels=int(os.getenv("NUM_ORDER_LEVELS", "1")),
        inventory_target_ratio=float(os.getenv("INVENTORY_TARGET_RATIO", "0.5")),
        inventory_skew_factor=float(os.getenv("INVENTORY_SKEW_FACTOR", "0.5")),
        min_spread=float(os.getenv("MIN_SPREAD", "0.012")),
        max_position_usdt=float(os.getenv("MAX_POSITION_USDT", "5000")),
        daily_loss_limit_usdt=float(os.getenv("DAILY_LOSS_LIMIT_USDT", "50")),
        seed_price=float(os.getenv("SEED_PRICE", "0")),
        volume_trade_interval_seconds=int(os.getenv("VOLUME_TRADE_INTERVAL_SECONDS", "1800")),
        volume_trade_amount_usdt=float(os.getenv("VOLUME_TRADE_AMOUNT_USDT", "20")),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
        log_file=os.getenv("LOG_FILE", "pmm.log"),
    )
