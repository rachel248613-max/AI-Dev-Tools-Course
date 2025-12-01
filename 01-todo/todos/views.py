from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils.dateparse import parse_datetime
from .models import Todo

def todo_list(request):
    todos = Todo.objects.all()
    return render(request, 'todos/todo_list.html', {'todos': todos})

def todo_create(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        description = request.POST.get('description')
        due_date_str = request.POST.get('due_date')

        if title:
            due_date = None
            if due_date_str:
                due_date = parse_datetime(due_date_str)

            todo = Todo.objects.create(
                title=title,
                description=description,
                due_date=due_date
            )
            messages.success(request, 'Todo created successfully!')
            return redirect('todo_list')
        else:
            messages.error(request, 'Title is required!')

    return render(request, 'todos/todo_form.html')

def todo_edit(request, pk):
    todo = get_object_or_404(Todo, pk=pk)

    if request.method == 'POST':
        title = request.POST.get('title')
        description = request.POST.get('description')
        due_date_str = request.POST.get('due_date')

        if title:
            todo.title = title
            todo.description = description

            if due_date_str:
                todo.due_date = parse_datetime(due_date_str)
            else:
                todo.due_date = None

            todo.save()
            messages.success(request, 'Todo updated successfully!')
            return redirect('todo_list')
        else:
            messages.error(request, 'Title is required!')

    return render(request, 'todos/todo_form.html', {'todo': todo})

def todo_delete(request, pk):
    todo = get_object_or_404(Todo, pk=pk)

    if request.method == 'POST':
        todo.delete()
        messages.success(request, 'Todo deleted successfully!')
        return redirect('todo_list')

    return render(request, 'todos/todo_confirm_delete.html', {'todo': todo})

def todo_toggle_resolved(request, pk):
    todo = get_object_or_404(Todo, pk=pk)
    todo.resolved = not todo.resolved
    todo.save()

    status = 'resolved' if todo.resolved else 'unresolved'
    messages.success(request, f'Todo marked as {status}!')
    return redirect('todo_list')
