// Create new list

$("#createNewListForm").submit((e) =>
{
    e.preventDefault();

    $.ajax({
        type: 'post',
        url: '/api/create',
        data: $("#createNewListForm").serialize(),
        dataType: "json",
        success: function (data)
        {
            console.log('Successfully created list.');
            $("#createNewListForm")[0].reset();
            $(".active").removeClass("active");
            let newTab = '<li class="nav-item"><a class="nav-link active" data-toggle="tab" href="#l' + data._id + '">' + data.name + '</a></li>';
            $("#addNewListTab").before(newTab);
            let newList;
            switch (data.type)
            {
                case "spendings":
                    newList = '<div class="tab-pane active" id="l' + data._id + '"><div class="total-balance"><h3>Balance</h3><h4>$ 0</h4><button class="btn btn-outline-dark btn-sm edit editBalance"><i class="fas fa-edit"></i></button><div class="hidden"><form class="updateBalanceForm"><input type="number" placeholder="Monto" step="0.1" min="0" name="newBalance" class="form-control value-input" style="margin: 1rem 0;" required><div class="button-wrapper"><button class="btn btn-sm btn-primary" type="submit">Actualizar</button><button class="btn btn-sm btn-danger cancelBalance" type="button">Cancelar</button></div></form></div></div><div class="row row-eq-height"><div class="col-lg-4 hidden"><div class="flow text-center"><div class="header-flow">Nuevo registro</div><form class="addSpendingItemForm"><div class="radio-input"><label>Ingreso</label><input type="radio" name="type" value="income" class="align-middle" required></div><div class="radio-input"><label>Gasto</label><input type="radio" name="type" value="expense" class="align-middle" required></div><div class="value-input-container"><input type="number" placeholder="Monto" step="0.1" min="0.1" name="value" class="form-control value-input" required></div><div class="description-input"><label>Descripción</label><input type="text" name="description" class="form-control" placeholder="Descripción breve" required></div><button class="btn btn-sm btn-primary sendForm"   type="submit">Enviar</button><button class="btn btn-sm btn-danger cancel" type="button">Cancelar</button></form></div></div><div class="col-lg-4 lastItem"><button class="btn btn-outline-dark align-middle center addItem"><i class="fas fa-plus-circle"></i></button></div><div class="col-lg-4 lastItem"><button class="btn btn-danger align-middle center deleteList">Eliminar colección</button></div></div></div>';
                    break;
                
                case "toDo":
                    newList = '<div class="tab-pane active" id="l' + data._id + '"><div class="row row-eq-height"><div class="col-lg-4 hidden"><div class="flow text-center"><div class="header-flow">Nuevo registro</div><form class="addToDoItemForm"><div class="description-input"><label>Fecha y hora</label><input type="date" name="date" class="form-control" required><input type="time" name="time" class="form-control" required></div><div class="description-input"><label>Actividad</label><input type="text" name="activity" class="form-control" placeholder="Descripción breve" required></div><button class="btn btn-sm btn-primary sendForm" type="submit">Enviar</button><button class="btn btn-sm btn-danger cancel" type="button">Cancelar</button></form></div></div><div class="col-lg-4 lastItem"><button class="btn btn-outline-dark align-middle center addItem"><i class="fas fa-plus-circle"></i></button></div><div class="col-lg-4 lastItem"><button class="btn btn-danger align-middle center deleteList">Eliminar colección</button></div></div></div>';
                    break;

                case "generic":
                    newList = '<div class="tab-pane active" id="l' + data._id + '"><div class="row row-eq-height"><div class="col-lg-4 hidden"><div class="flow text-center"><div class="header-flow">Nuevo registro</div><form class="addGenericItemForm"><div class="description-input"><label>Contenido</label><input type="text" name="description" class="form-control" placeholder="Descripción breve" required></div><button class="btn btn-sm btn-primary sendForm" type="submit">Enviar</button><button class="btn btn-sm btn-danger cancel" type="button">Cancelar</button></form></div></div><div class="col-lg-4 lastItem"><button class="btn btn-outline-dark align-middle center addItem"><i class="fas fa-plus-circle"></i></button></div><div class="col-lg-4 lastItem"><button class="btn btn-danger align-middle center deleteList">Eliminar colección</button></div></div></div>';
                    break;
            }
            $("#addNewList").before(newList);
        }
    });
});



// Delete list

$(".tab-content").on("click", ".deleteList", function ()
{
    let listToDelete = $(this).parents(".tab-pane");
    let id = listToDelete.attr("id");
    $.ajax({
        type: 'delete',
        url: '/api/delete',
        data: ("id=" + id.substring(1)),
        success: function ()
        {
            console.log('Successfully deleted list.');
            listToDelete.next().addClass("active");
            listToDelete.remove();
            let tab = $('[href="#' + id + '"]').parent();
            tab.next().children().addClass("active");
            tab.remove();
        }
    });
});


/*************** ITEMS *************/

// Toggle form
$(".tab-content").on("click", ".addItem", function ()
{
    let element = $(this).parent().prev();

    if (element.hasClass("hidden"))
    {
        element.toggleClass("hidden");
    }
});

$(".tab-content").on("click", ".cancel", function ()
{
    $(this).parents(".col-lg-4").toggleClass("hidden");
});

// Add spending item
$(".tab-content").on("submit", ".addSpendingItemForm", function (e)
{
    e.preventDefault();

    let id = $(this).parents(".tab-pane").attr("id").substring(1);
    let itemData = $(this).serialize();
    let toSend = itemData + "&id=" + id;
    let balanceObj = $(this).parents(".row").prev().find("h4");

    let element = this;
    $.ajax({
        type: 'post',
        url: '/api/create/spendings/item',
        data: toSend,
        dataType: "json",
        success: function (data)
        {
            console.log(data);
            console.log('Successfully created new spendings item.');
            element.reset();
            let col = $(element).parents(".col-lg-4");
            col.toggleClass("hidden");
            col.before('<div class="col-lg-4"><div class="flow ' + data.content.type + '" id="s' + data.content._id + '"><div class="header-flow">' + (data.content.type === 'income' ? '+' : '-') + ' $ ' + data.content.value + '</div><div class="body-flow">' + data.content.description + '</div><div class="button-wrapper"><button class="btn btn-outline-dark btn-sm edit deleteItem"><i class="fas fa-trash"></i></button></div></div></div>');
            balanceObj.text("$ " + data.newBalance);
        }
    });

});


// Delete item
$(".tab-content").on("click", ".deleteItem", function ()
{
    let flowElement = $(this).parents(".flow");
    let itemId = flowElement.attr("id").substring(1);
    let listId = $(this).parents(".tab-pane").attr("id").substring(1);
    let toSend = ("itemId=" + itemId + "&listId=" + listId);

    $.ajax({
        type: 'delete',
        url: '/api/delete/item',
        data: toSend,
        success: function ()
        {
            console.log('Successfully deleted item.');
            flowElement.parent().remove();
        }
    });
});

// Edit balance

$(".tab-content").on("click", ".editBalance", function ()
{
    $(this).next().toggleClass("hidden");
});

$(".tab-content").on("click", ".cancelBalance", function ()
{
    $(this).parent().parent().parent().toggleClass("hidden");
});

$(".tab-content").on("submit", ".updateBalanceForm", function (e)
{
    e.preventDefault();

    let id = $(this).parent().parent().parent().attr("id").substring(1);
    let newBalance = $(this).serialize();
    let toSend = "id=" + id + "&" + newBalance;

    let element = this;
    $.ajax({
        type: 'patch',
        url: '/api/balance',
        data: toSend,
        dataType: "json",
        success: function (data)
        {
            console.log('Successfully updated balance.');
            element.reset();
            $(element).parent().prevAll("h4").text("$ " + data.newBalance);
            $(element).parent().toggleClass("hidden");
        }
    });
});


/* Add toDo item */

$(".tab-content").on("submit", ".addToDoItemForm", function (e)
{
    e.preventDefault();

    let id = $(this).parents(".tab-pane").attr("id").substring(1);
    let itemData = $(this).serialize();
    let toSend = itemData + "&id=" + id;

    let element = this;
    $.ajax({
        type: 'post',
        url: '/api/create/toDo/item',
        data: toSend,
        dataType: "json",
        success: function (data)
        {
            console.log(data);
            console.log('Successfully created new ToDo item.');
            element.reset();
            let col = $(element).parents(".col-lg-4");
            col.toggleClass("hidden");
            let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            let date = new Date(data.date);
            let dateStr = date.toLocaleDateString('es', options);
            dateStr = dateStr[0].toUpperCase() + dateStr.substring(1);
            col.before('<div class="col-lg-4"><div class="flow toDoItem" id="t' + data.id + '"><div class="header-flow ' + (data.passed ? "passed" : "") + '">' + dateStr + '</div><div class="header-flow ' + (data.passed ? "passed" : "") + '">' + data.time + '</div><div class="body-flow">' + data.activity + '</div><div class="button-wrapper"><button class="btn btn-outline-dark btn-sm edit deleteItem"><i class="fas fa-trash"></i></button></div></div></div>');
        }
    });

});


// Modify date to display it properly
$(document).ready( function () {

    $(".date").each(function()
    {
    let date = new Date($(this).text());
    let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let dateStr = date.toLocaleDateString('es', options);
    dateStr = dateStr[0].toUpperCase() + dateStr.substring(1);
    let hours = date.getHours().toString().padStart(2, "0");
    let minutes = date.getMinutes().toString().padStart(2, "0");
    let timeStr = hours + ":" + minutes;

    $(this).text(dateStr);
    $(this).next().text(timeStr);
    });
    

});

/* Add generic item */

$(".tab-content").on("submit", ".addGenericItemForm", function (e)
{
    e.preventDefault();

    let id = $(this).parents(".tab-pane").attr("id").substring(1);
    let itemData = $(this).serialize();
    let toSend = itemData + "&id=" + id;

    let element = this;
    $.ajax({
        type: 'post',
        url: '/api/create/generic/item',
        data: toSend,
        dataType: "json",
        success: function (data)
        {
            console.log(data);
            console.log('Successfully created new generic item.');
            element.reset();
            let col = $(element).parents(".col-lg-4");
            col.toggleClass("hidden");
            col.before('<div class="col-lg-4"><div class="flow genericItem" id="g' + data._id  + '"><div class="header-flow">' + data.description + '</div><div class="button-wrapper"><button class="btn btn-outline-dark btn-sm edit deleteItem"><i class="fas fa-trash"></i></button></div></div></div>');
        }
    });
});
