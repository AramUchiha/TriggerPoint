import pytest
from typer.testing import CliRunner

from tp_pipeline.cli import app
from tp_pipeline.config import load_bbox

STUB_COMMANDS = [
    "fetch-dem",
    "fetch-fuels",
    "build-communities",
    "run-windninja",
    "run-elmfire",
    "hindcast-latuna",
    "export-web",
]


@pytest.mark.parametrize("command", STUB_COMMANDS)
def test_stub_commands_print_todo_and_fail(command: str) -> None:
    result = CliRunner().invoke(app, [command])
    assert result.exit_code == 1
    assert "TODO" in result.output


def test_bbox_config_is_valid() -> None:
    bbox = load_bbox()
    assert bbox.as_list() == [-118.32, 34.12, -118.17, 34.27]
