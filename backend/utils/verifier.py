from typing import Any

from utils.functions import runAsyncTask


class Task:
    def __init__(self, func: function, *args):
        self.function = func
        self.args = args


class Task_result:
    def __init__(self, success: bool, data: Any):
        self.success = success
        self.data = data


class Verifier:

    def __init__(self, tasks: list[Task] = []):
        self._tasks: list[Task] = [*tasks]
        self._results: dict[str, Task_result] = {}
        self._tasks_started = False

    def add_task(self, task: Task):
        self._tasks.append(task)

    def start_tasks(self):
        self._tasks_started = True
        for task in self._tasks:
            runAsyncTask(task.function, *task.args)

    def add_result(self, key: str, result: Task_result):
        already_exists = self._results.get(key) is not None
        if already_exists:
            raise RuntimeError(f'Key "{key}" already has been set')
        self._results[key] = result

    def get_result(self) -> tuple[bool, dict[str, Task_result], dict[str, Task_result]]:
        if self._tasks_started == False:
            self.start_tasks()

        while len(self._tasks) != len(self._results):
            try:
                results = self._results.values()
                for result in results:
                    if not result.success:
                        return False, results, result
            except:  # dictionary size changed on iteration
                pass

        results = self._results.values()
        for result in results:
            if not result.success:
                return False, results, result

        return True, results, None
