import pytest
from jupyter_server.auth import IdentityProvider


@pytest.fixture
def jp_server_config(jp_server_config):
    return {
        "ServerApp": {
            "jpserver_extensions": {"mamba_gator": True},
            "identity_provider_class": IdentityProvider,
            "token": "",
            "disable_check_xsrf": True
        },
        "IdentityProvider": {
            "token": ""
        }
    }