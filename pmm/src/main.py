"""Entry point for the Mars Credit PMM market making bot."""

from .config import load_config
from .latoken_client import LatokenWrapper
from .logger import setup_logger
from .strategy import PMMStrategy


def main() -> None:
    config = load_config()
    setup_logger(log_level=config.log_level, log_file=config.log_file)

    client = LatokenWrapper(config)
    strategy = PMMStrategy(config, client)
    strategy.start()


if __name__ == "__main__":
    main()
