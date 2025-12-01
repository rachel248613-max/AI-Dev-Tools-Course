from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from .models import Todo


class TodoModelTests(TestCase):
    """Test cases for the Todo model"""

    def setUp(self):
        """Set up test data"""
        self.todo = Todo.objects.create(
            title="Test Todo",
            description="Test Description",
            due_date=timezone.now() + timedelta(days=1)
        )

    def test_create_todo_with_all_fields(self):
        """Test creating a todo with all fields"""
        todo = Todo.objects.create(
            title="Complete Todo",
            description="Complete description",
            due_date=timezone.now() + timedelta(days=2),
            resolved=True
        )
        self.assertEqual(todo.title, "Complete Todo")
        self.assertEqual(todo.description, "Complete description")
        self.assertIsNotNone(todo.due_date)
        self.assertTrue(todo.resolved)

    def test_create_todo_with_only_title(self):
        """Test creating a todo with only required fields"""
        todo = Todo.objects.create(title="Minimal Todo")
        self.assertEqual(todo.title, "Minimal Todo")
        self.assertIsNone(todo.description)
        self.assertIsNone(todo.due_date)
        self.assertFalse(todo.resolved)

    def test_todo_default_resolved_is_false(self):
        """Test that resolved defaults to False"""
        todo = Todo.objects.create(title="New Todo")
        self.assertFalse(todo.resolved)

    def test_todo_created_at_auto_set(self):
        """Test that created_at is set automatically"""
        todo = Todo.objects.create(title="Timestamped Todo")
        self.assertIsNotNone(todo.created_at)
        self.assertLessEqual(todo.created_at, timezone.now())

    def test_todo_updated_at_changes_on_save(self):
        """Test that updated_at changes when todo is saved"""
        original_updated = self.todo.updated_at
        self.todo.title = "Updated Title"
        self.todo.save()
        self.assertGreater(self.todo.updated_at, original_updated)

    def test_todo_str_method(self):
        """Test __str__ returns title"""
        self.assertEqual(str(self.todo), "Test Todo")

    def test_is_overdue_returns_true_for_overdue_unresolved(self):
        """Test is_overdue returns True for overdue unresolved todos"""
        overdue_todo = Todo.objects.create(
            title="Overdue Todo",
            due_date=timezone.now() - timedelta(days=1),
            resolved=False
        )
        self.assertTrue(overdue_todo.is_overdue())

    def test_is_overdue_returns_false_for_resolved(self):
        """Test is_overdue returns False for resolved todos even if past due"""
        resolved_overdue = Todo.objects.create(
            title="Resolved Overdue",
            due_date=timezone.now() - timedelta(days=1),
            resolved=True
        )
        self.assertFalse(resolved_overdue.is_overdue())

    def test_is_overdue_returns_false_without_due_date(self):
        """Test is_overdue returns False for todos without due_date"""
        no_due_date = Todo.objects.create(title="No Due Date")
        self.assertFalse(no_due_date.is_overdue())

    def test_is_overdue_returns_false_for_future_due_date(self):
        """Test is_overdue returns False for future due dates"""
        future_todo = Todo.objects.create(
            title="Future Todo",
            due_date=timezone.now() + timedelta(days=1)
        )
        self.assertFalse(future_todo.is_overdue())

    def test_todo_ordering(self):
        """Test todos are ordered by created_at descending"""
        Todo.objects.all().delete()
        todo1 = Todo.objects.create(title="First")
        todo2 = Todo.objects.create(title="Second")
        todo3 = Todo.objects.create(title="Third")

        todos = list(Todo.objects.all())
        self.assertEqual(todos[0], todo3)
        self.assertEqual(todos[1], todo2)
        self.assertEqual(todos[2], todo1)

    def test_title_max_length(self):
        """Test title max length constraint"""
        long_title = "x" * 200
        todo = Todo.objects.create(title=long_title)
        self.assertEqual(len(todo.title), 200)

    def test_description_can_be_blank(self):
        """Test description can be blank"""
        todo = Todo.objects.create(title="No Description")
        self.assertTrue(todo.description is None or todo.description == "")

    def test_due_date_accepts_none(self):
        """Test due_date accepts None"""
        todo = Todo.objects.create(title="No Due Date", due_date=None)
        self.assertIsNone(todo.due_date)


class TodoListViewTests(TestCase):
    """Test cases for the todo_list view"""

    def setUp(self):
        self.client = Client()
        self.url = reverse('todo_list')

    def test_list_view_returns_200(self):
        """Test GET returns 200 status code"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_list_view_uses_correct_template(self):
        """Test correct template is used"""
        response = self.client.get(self.url)
        self.assertTemplateUsed(response, 'todos/todo_list.html')

    def test_list_view_displays_all_todos(self):
        """Test displays all todos in context"""
        Todo.objects.create(title="Todo 1")
        Todo.objects.create(title="Todo 2")

        response = self.client.get(self.url)
        self.assertEqual(len(response.context['todos']), 2)

    def test_list_view_displays_empty_state(self):
        """Test displays empty state when no todos"""
        response = self.client.get(self.url)
        self.assertEqual(len(response.context['todos']), 0)
        self.assertContains(response, "No todos yet")

    def test_list_view_todos_ordered_correctly(self):
        """Test todos are ordered correctly (newest first)"""
        todo1 = Todo.objects.create(title="First")
        todo2 = Todo.objects.create(title="Second")

        response = self.client.get(self.url)
        todos = response.context['todos']
        self.assertEqual(todos[0], todo2)
        self.assertEqual(todos[1], todo1)

    def test_list_view_shows_overdue_badge(self):
        """Test overdue badge appears for overdue todos"""
        Todo.objects.create(
            title="Overdue",
            due_date=timezone.now() - timedelta(days=1)
        )
        response = self.client.get(self.url)
        self.assertContains(response, "Overdue")

    def test_list_view_shows_resolved_badge(self):
        """Test resolved badge appears for resolved todos"""
        Todo.objects.create(title="Done", resolved=True)
        response = self.client.get(self.url)
        self.assertContains(response, "Resolved")


class TodoCreateViewTests(TestCase):
    """Test cases for the todo_create view"""

    def setUp(self):
        self.client = Client()
        self.url = reverse('todo_create')

    def test_create_view_get_returns_200(self):
        """Test GET returns 200 and correct template"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'todos/todo_form.html')

    def test_create_todo_with_valid_data(self):
        """Test POST with valid data creates todo"""
        data = {
            'title': 'New Todo',
            'description': 'New Description',
            'due_date': ''
        }
        response = self.client.post(self.url, data)
        self.assertEqual(Todo.objects.count(), 1)
        todo = Todo.objects.first()
        self.assertEqual(todo.title, 'New Todo')
        self.assertEqual(todo.description, 'New Description')

    def test_create_todo_redirects_to_list(self):
        """Test POST with valid data redirects to todo_list"""
        data = {'title': 'New Todo', 'description': '', 'due_date': ''}
        response = self.client.post(self.url, data)
        self.assertRedirects(response, reverse('todo_list'))

    def test_create_todo_shows_success_message(self):
        """Test POST with valid data shows success message"""
        data = {'title': 'New Todo', 'description': '', 'due_date': ''}
        response = self.client.post(self.url, data, follow=True)
        messages = list(response.context['messages'])
        self.assertEqual(len(messages), 1)
        self.assertIn('created successfully', str(messages[0]))

    def test_create_todo_without_title_shows_error(self):
        """Test POST without title shows error message"""
        data = {'title': '', 'description': 'No title', 'due_date': ''}
        response = self.client.post(self.url, data, follow=True)
        messages = list(response.context['messages'])
        self.assertEqual(len(messages), 1)
        self.assertIn('required', str(messages[0]))
        self.assertEqual(Todo.objects.count(), 0)

    def test_create_todo_with_due_date(self):
        """Test POST with due_date creates todo correctly"""
        due_date = (timezone.now() + timedelta(days=1)).isoformat()
        data = {
            'title': 'Todo with date',
            'description': '',
            'due_date': due_date
        }
        response = self.client.post(self.url, data)
        todo = Todo.objects.first()
        self.assertIsNotNone(todo.due_date)

    def test_create_todo_without_due_date(self):
        """Test POST without due_date creates todo with None"""
        data = {'title': 'No date', 'description': '', 'due_date': ''}
        response = self.client.post(self.url, data)
        todo = Todo.objects.first()
        self.assertIsNone(todo.due_date)

    def test_create_todo_with_empty_due_date_string(self):
        """Test POST with empty due_date string saves as None"""
        data = {'title': 'Empty date', 'description': '', 'due_date': ''}
        response = self.client.post(self.url, data)
        todo = Todo.objects.first()
        self.assertIsNone(todo.due_date)


class TodoEditViewTests(TestCase):
    """Test cases for the todo_edit view"""

    def setUp(self):
        self.client = Client()
        self.todo = Todo.objects.create(
            title="Original Title",
            description="Original Description"
        )
        self.url = reverse('todo_edit', args=[self.todo.pk])

    def test_edit_view_get_returns_200(self):
        """Test GET with valid pk returns 200"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_edit_view_with_invalid_pk_returns_404(self):
        """Test GET with invalid pk returns 404"""
        url = reverse('todo_edit', args=[9999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_edit_view_uses_correct_template(self):
        """Test GET displays correct template with todo data"""
        response = self.client.get(self.url)
        self.assertTemplateUsed(response, 'todos/todo_form.html')
        self.assertEqual(response.context['todo'], self.todo)

    def test_edit_todo_with_valid_data(self):
        """Test POST with valid data updates todo"""
        data = {
            'title': 'Updated Title',
            'description': 'Updated Description',
            'due_date': ''
        }
        response = self.client.post(self.url, data)
        self.todo.refresh_from_db()
        self.assertEqual(self.todo.title, 'Updated Title')
        self.assertEqual(self.todo.description, 'Updated Description')

    def test_edit_todo_redirects_to_list(self):
        """Test POST with valid data redirects to todo_list"""
        data = {'title': 'Updated', 'description': '', 'due_date': ''}
        response = self.client.post(self.url, data)
        self.assertRedirects(response, reverse('todo_list'))

    def test_edit_todo_shows_success_message(self):
        """Test POST with valid data shows success message"""
        data = {'title': 'Updated', 'description': '', 'due_date': ''}
        response = self.client.post(self.url, data, follow=True)
        messages = list(response.context['messages'])
        self.assertEqual(len(messages), 1)
        self.assertIn('updated successfully', str(messages[0]))

    def test_edit_todo_without_title_shows_error(self):
        """Test POST without title shows error message"""
        data = {'title': '', 'description': 'No title', 'due_date': ''}
        response = self.client.post(self.url, data, follow=True)
        messages = list(response.context['messages'])
        self.assertEqual(len(messages), 1)
        self.assertIn('required', str(messages[0]))

    def test_edit_updates_title_correctly(self):
        """Test POST updates title correctly"""
        data = {'title': 'New Title', 'description': self.todo.description, 'due_date': ''}
        self.client.post(self.url, data)
        self.todo.refresh_from_db()
        self.assertEqual(self.todo.title, 'New Title')

    def test_edit_updates_description_correctly(self):
        """Test POST updates description correctly"""
        data = {'title': self.todo.title, 'description': 'New Description', 'due_date': ''}
        self.client.post(self.url, data)
        self.todo.refresh_from_db()
        self.assertEqual(self.todo.description, 'New Description')

    def test_edit_updates_due_date_correctly(self):
        """Test POST updates due_date correctly"""
        due_date = (timezone.now() + timedelta(days=5)).isoformat()
        data = {'title': self.todo.title, 'description': '', 'due_date': due_date}
        self.client.post(self.url, data)
        self.todo.refresh_from_db()
        self.assertIsNotNone(self.todo.due_date)

    def test_edit_with_empty_due_date_clears_it(self):
        """Test POST with empty due_date clears due_date"""
        self.todo.due_date = timezone.now()
        self.todo.save()

        data = {'title': self.todo.title, 'description': '', 'due_date': ''}
        self.client.post(self.url, data)
        self.todo.refresh_from_db()
        self.assertIsNone(self.todo.due_date)

    def test_edit_doesnt_change_created_at(self):
        """Test POST doesn't change created_at"""
        original_created = self.todo.created_at
        data = {'title': 'Updated', 'description': '', 'due_date': ''}
        self.client.post(self.url, data)
        self.todo.refresh_from_db()
        self.assertEqual(self.todo.created_at, original_created)


class TodoDeleteViewTests(TestCase):
    """Test cases for the todo_delete view"""

    def setUp(self):
        self.client = Client()
        self.todo = Todo.objects.create(title="To Delete")
        self.url = reverse('todo_delete', args=[self.todo.pk])

    def test_delete_view_get_returns_200(self):
        """Test GET with valid pk returns 200 and confirmation page"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'todos/todo_confirm_delete.html')

    def test_delete_view_with_invalid_pk_returns_404(self):
        """Test GET with invalid pk returns 404"""
        url = reverse('todo_delete', args=[9999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_delete_todo_with_post(self):
        """Test POST with valid pk deletes todo"""
        response = self.client.post(self.url)
        self.assertEqual(Todo.objects.count(), 0)

    def test_delete_redirects_after_deletion(self):
        """Test POST redirects to todo_list after deletion"""
        response = self.client.post(self.url)
        self.assertRedirects(response, reverse('todo_list'))

    def test_delete_shows_success_message(self):
        """Test POST shows success message"""
        response = self.client.post(self.url, follow=True)
        messages = list(response.context['messages'])
        self.assertEqual(len(messages), 1)
        self.assertIn('deleted successfully', str(messages[0]))

    def test_deleted_todo_removed_from_database(self):
        """Test deleted todo is actually removed from database"""
        todo_pk = self.todo.pk
        self.client.post(self.url)
        with self.assertRaises(Todo.DoesNotExist):
            Todo.objects.get(pk=todo_pk)

    def test_delete_post_with_invalid_pk_returns_404(self):
        """Test POST with invalid pk returns 404"""
        url = reverse('todo_delete', args=[9999])
        response = self.client.post(url)
        self.assertEqual(response.status_code, 404)


class TodoToggleResolvedViewTests(TestCase):
    """Test cases for the todo_toggle_resolved view"""

    def setUp(self):
        self.client = Client()
        self.todo = Todo.objects.create(title="Toggle Me", resolved=False)
        self.url = reverse('todo_toggle_resolved', args=[self.todo.pk])

    def test_toggle_resolved_from_false_to_true(self):
        """Test POST toggles resolved from False to True"""
        response = self.client.post(self.url)
        self.todo.refresh_from_db()
        self.assertTrue(self.todo.resolved)

    def test_toggle_resolved_from_true_to_false(self):
        """Test POST toggles resolved from True to False"""
        self.todo.resolved = True
        self.todo.save()

        response = self.client.post(self.url)
        self.todo.refresh_from_db()
        self.assertFalse(self.todo.resolved)

    def test_toggle_redirects_to_list(self):
        """Test POST redirects to todo_list"""
        response = self.client.post(self.url)
        self.assertRedirects(response, reverse('todo_list'))

    def test_toggle_shows_success_message(self):
        """Test POST shows correct success message"""
        response = self.client.post(self.url, follow=True)
        messages = list(response.context['messages'])
        self.assertEqual(len(messages), 1)
        self.assertIn('marked as', str(messages[0]))

    def test_toggle_with_invalid_pk_returns_404(self):
        """Test POST with invalid pk returns 404"""
        url = reverse('todo_toggle_resolved', args=[9999])
        response = self.client.post(url)
        self.assertEqual(response.status_code, 404)


class URLTests(TestCase):
    """Test cases for URL patterns and reversing"""

    def test_list_url_resolves(self):
        """Test '/' resolves to todo_list view"""
        url = reverse('todo_list')
        self.assertEqual(url, '/')

    def test_create_url_resolves(self):
        """Test '/create/' resolves to todo_create view"""
        url = reverse('todo_create')
        self.assertEqual(url, '/create/')

    def test_edit_url_resolves(self):
        """Test '/edit/1/' resolves to todo_edit view"""
        url = reverse('todo_edit', args=[1])
        self.assertEqual(url, '/edit/1/')

    def test_delete_url_resolves(self):
        """Test '/delete/1/' resolves to todo_delete view"""
        url = reverse('todo_delete', args=[1])
        self.assertEqual(url, '/delete/1/')

    def test_toggle_url_resolves(self):
        """Test '/toggle/1/' resolves to todo_toggle_resolved view"""
        url = reverse('todo_toggle_resolved', args=[1])
        self.assertEqual(url, '/toggle/1/')


class IntegrationTests(TestCase):
    """End-to-end integration tests"""

    def setUp(self):
        self.client = Client()

    def test_create_and_list_workflow(self):
        """Test create → list → shows new todo"""
        data = {'title': 'Integration Test', 'description': '', 'due_date': ''}
        self.client.post(reverse('todo_create'), data)

        response = self.client.get(reverse('todo_list'))
        self.assertContains(response, 'Integration Test')

    def test_create_edit_list_workflow(self):
        """Test create → edit → list → shows updated todo"""
        data = {'title': 'Original', 'description': '', 'due_date': ''}
        self.client.post(reverse('todo_create'), data)

        todo = Todo.objects.first()
        edit_data = {'title': 'Updated', 'description': '', 'due_date': ''}
        self.client.post(reverse('todo_edit', args=[todo.pk]), edit_data)

        response = self.client.get(reverse('todo_list'))
        self.assertContains(response, 'Updated')
        self.assertNotContains(response, 'Original')

    def test_create_delete_list_workflow(self):
        """Test create → delete → list → todo is gone"""
        data = {'title': 'To Be Deleted', 'description': '', 'due_date': ''}
        self.client.post(reverse('todo_create'), data)

        todo = Todo.objects.first()
        self.client.post(reverse('todo_delete', args=[todo.pk]))

        response = self.client.get(reverse('todo_list'))
        self.assertNotContains(response, 'To Be Deleted')

    def test_create_toggle_list_workflow(self):
        """Test create → toggle resolved → list → shows resolved"""
        data = {'title': 'To Resolve', 'description': '', 'due_date': ''}
        self.client.post(reverse('todo_create'), data)

        todo = Todo.objects.first()
        self.client.post(reverse('todo_toggle_resolved', args=[todo.pk]))

        response = self.client.get(reverse('todo_list'))
        self.assertContains(response, 'Resolved')


class EdgeCaseTests(TestCase):
    """Test edge cases and boundary conditions"""

    def setUp(self):
        self.client = Client()

    def test_todo_with_max_length_title(self):
        """Test todo with very long title (max length)"""
        long_title = "x" * 200
        data = {'title': long_title, 'description': '', 'due_date': ''}
        self.client.post(reverse('todo_create'), data)

        todo = Todo.objects.first()
        self.assertEqual(len(todo.title), 200)

    def test_todo_with_very_long_description(self):
        """Test todo with very long description"""
        long_description = "x" * 10000
        data = {'title': 'Long desc', 'description': long_description, 'due_date': ''}
        self.client.post(reverse('todo_create'), data)

        todo = Todo.objects.first()
        self.assertEqual(len(todo.description), 10000)

    def test_todo_with_special_characters(self):
        """Test todo with special characters and Unicode"""
        special_title = "Todo with émojis 🎉 and spëcial ©haracters"
        data = {'title': special_title, 'description': '', 'due_date': ''}
        self.client.post(reverse('todo_create'), data)

        todo = Todo.objects.first()
        self.assertEqual(todo.title, special_title)

    def test_todo_with_html_in_title(self):
        """Test todo with HTML in title (XSS prevention check)"""
        html_title = "<script>alert('xss')</script>Normal Title"
        data = {'title': html_title, 'description': '', 'due_date': ''}
        self.client.post(reverse('todo_create'), data)

        response = self.client.get(reverse('todo_list'))
        # HTML should be escaped in the response
        self.assertContains(response, '&lt;script&gt;')

    def test_creating_many_todos(self):
        """Test creating 100 todos (performance check)"""
        for i in range(100):
            Todo.objects.create(title=f"Todo {i}")

        self.assertEqual(Todo.objects.count(), 100)
        response = self.client.get(reverse('todo_list'))
        self.assertEqual(response.status_code, 200)


class SecurityTests(TestCase):
    """Test security features"""

    def setUp(self):
        self.client = Client()

    def test_csrf_token_in_create_form(self):
        """Test CSRF token is present in create form"""
        response = self.client.get(reverse('todo_create'))
        self.assertContains(response, 'csrfmiddlewaretoken')

    def test_csrf_token_in_edit_form(self):
        """Test CSRF token is present in edit form"""
        todo = Todo.objects.create(title="Test")
        response = self.client.get(reverse('todo_edit', args=[todo.pk]))
        self.assertContains(response, 'csrfmiddlewaretoken')

    def test_csrf_token_in_delete_form(self):
        """Test CSRF token is present in delete form"""
        todo = Todo.objects.create(title="Test")
        response = self.client.get(reverse('todo_delete', args=[todo.pk]))
        self.assertContains(response, 'csrfmiddlewaretoken')

    def test_html_escaped_in_title(self):
        """Test HTML tags in title are escaped"""
        todo = Todo.objects.create(title="<b>Bold</b> Title")
        response = self.client.get(reverse('todo_list'))
        self.assertContains(response, '&lt;b&gt;')

    def test_html_escaped_in_description(self):
        """Test JavaScript in description is escaped"""
        todo = Todo.objects.create(
            title="Test",
            description="<script>alert('xss')</script>"
        )
        response = self.client.get(reverse('todo_list'))
        self.assertContains(response, '&lt;script&gt;')
