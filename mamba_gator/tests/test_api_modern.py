import pytest
import time
import requests

pytest_plugins = [
    "pytest_jupyter.jupyter_server",
    "mamba_gator.tests.fixtures"
]


def test_server_starts(jp_server_config, jp_http_port):
    """Test that the server configuration is valid"""
    print("Server config:", jp_server_config)
    print("HTTP port:", jp_http_port)

    assert jp_server_config is not None
    assert "ServerApp" in jp_server_config
    assert "jpserver_extensions" in jp_server_config["ServerApp"]
    assert jp_server_config["ServerApp"]["jpserver_extensions"]["mamba_gator"] is True
