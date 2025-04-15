document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const searchBtn = document.getElementById('search-btn');
    const randomBtn = document.getElementById('random-btn');
    const ingredientInput = document.getElementById('ingredient-input');
    const categoryFilter = document.getElementById('category-filter');
    const areaFilter = document.getElementById('area-filter');
    const resultsGrid = document.getElementById('results-grid');
    const loadingElement = document.getElementById('loading');
    const noResultsElement = document.getElementById('no-results');
    const recipeModal = document.getElementById('recipe-modal');
    const modalContent = document.getElementById('modal-content');
    const closeBtn = document.querySelector('.close-btn');
    
    // Variáveis globais
    let allCategories = [];
    let allAreas = [];
    let currentRecipes = [];
    
    // Inicialização
    initApp();
    
    // Função para inicializar o aplicativo
    async function initApp() {
        // Carrega categorias e áreas para os filtros
        await Promise.all([
            fetchCategories(),
            fetchAreas()
        ]);
        
        // Event listeners
        searchBtn.addEventListener('click', searchRecipes);
        randomBtn.addEventListener('click', fetchRandomRecipe);
        ingredientInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchRecipes();
        });
        
        categoryFilter.addEventListener('change', filterRecipes);
        areaFilter.addEventListener('change', filterRecipes);
        
        closeBtn.addEventListener('click', () => {
            recipeModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === recipeModal) {
                recipeModal.style.display = 'none';
            }
        });
    }
    
    // Função para buscar receitas por ingrediente
    async function searchRecipes() {
        const ingredient = ingredientInput.value.trim();
        
        if (!ingredient) {
            alert('Por favor, digite um ingrediente para buscar.');
            return;
        }
        
        showLoading();
        
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`);
            const data = await response.json();
            
            if (data.meals) {
                currentRecipes = data.meals;
                displayRecipes(currentRecipes);
            } else {
                showNoResults();
            }
        } catch (error) {
            console.error('Erro ao buscar receitas:', error);
            showNoResults();
        } finally {
            hideLoading();
        }
    }
    
    // Função para filtrar receitas com base nos seletores
    function filterRecipes() {
        const category = categoryFilter.value;
        const area = areaFilter.value;
        
        let filtered = currentRecipes;
        
        if (category) {
            filtered = filtered.filter(recipe => recipe.strCategory === category);
        }
        
        if (area) {
            filtered = filtered.filter(recipe => recipe.strArea === area);
        }
        
        displayRecipes(filtered);
    }
    
    // Função para buscar uma receita aleatória
    async function fetchRandomRecipe() {
        showLoading();
        
        try {
            const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
            const data = await response.json();
            
            if (data.meals) {
                // Mostra a receita aleatória diretamente no modal
                displayRecipeDetails(data.meals[0]);
            }
        } catch (error) {
            console.error('Erro ao buscar receita aleatória:', error);
        } finally {
            hideLoading();
        }
    }
    
    // Função para buscar todas as categorias disponíveis
    async function fetchCategories() {
        try {
            const response = await fetch('https://www.themealdb.com/api/json/v1/1/categories.php');
            const data = await response.json();
            
            if (data.categories) {
                allCategories = data.categories;
                
                // Preenche o dropdown de categorias
                allCategories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.strCategory;
                    option.textContent = category.strCategory;
                    categoryFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
        }
    }
    
    // Função para buscar todas as áreas/cozinhas disponíveis
    async function fetchAreas() {
        try {
            const response = await fetch('https://www.themealdb.com/api/json/v1/1/list.php?a=list');
            const data = await response.json();
            
            if (data.meals) {
                allAreas = data.meals;
                
                // Preenche o dropdown de áreas
                allAreas.forEach(area => {
                    const option = document.createElement('option');
                    option.value = area.strArea;
                    option.textContent = area.strArea;
                    areaFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao buscar áreas:', error);
        }
    }
    
    // Função para exibir receitas na grade de resultados
    function displayRecipes(recipes) {
        resultsGrid.innerHTML = '';
        
        if (recipes.length === 0) {
            showNoResults();
            return;
        }
        
        recipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            recipeCard.innerHTML = `
                <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="recipe-img">
                <div class="recipe-info">
                    <h3 class="recipe-title">${recipe.strMeal}</h3>
                    ${recipe.strCategory ? `<span class="recipe-category">${recipe.strCategory}</span>` : ''}
                    ${recipe.strArea ? `<span class="recipe-area">${recipe.strArea}</span>` : ''}
                    <button class="view-recipe" data-id="${recipe.idMeal}">Ver Receita</button>
                </div>
            `;
            
            resultsGrid.appendChild(recipeCard);
        });
        
        // Adiciona event listeners aos botões "Ver Receita"
        document.querySelectorAll('.view-recipe').forEach(button => {
            button.addEventListener('click', async (e) => {
                const recipeId = e.target.getAttribute('data-id');
                await fetchRecipeDetails(recipeId);
            });
        });
    }
    
    // Função para buscar detalhes de uma receita específica
    async function fetchRecipeDetails(recipeId) {
        showLoading();
        
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);
            const data = await response.json();
            
            if (data.meals) {
                displayRecipeDetails(data.meals[0]);
            }
        } catch (error) {
            console.error('Erro ao buscar detalhes da receita:', error);
        } finally {
            hideLoading();
        }
    }
    
    // Função para exibir detalhes da receita no modal
    function displayRecipeDetails(recipe) {
        modalContent.innerHTML = '';
        
        // Extrai ingredientes e medidas
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = recipe[`strIngredient${i}`];
            const measure = recipe[`strMeasure${i}`];
            
            if (ingredient && ingredient.trim() !== '') {
                ingredients.push({
                    ingredient: ingredient,
                    measure: measure || ''
                });
            }
        }
        
        // Cria tags se existirem
        let tags = [];
        if (recipe.strTags) {
            tags = recipe.strTags.split(',');
        }
        
        // Cria o conteúdo do modal
        const recipeDetail = document.createElement('div');
        recipeDetail.className = 'recipe-detail';
        recipeDetail.innerHTML = `
            <div class="recipe-header">
                <h2 class="recipe-detail-title">${recipe.strMeal}</h2>
                <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="recipe-detail-img">
                
                <div class="recipe-meta">
                    ${recipe.strCategory ? `<span class="tag">${recipe.strCategory}</span>` : ''}
                    ${recipe.strArea ? `<span class="tag">${recipe.strArea}</span>` : ''}
                </div>
                
                ${tags.length > 0 ? `
                <div class="recipe-tags">
                    ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                ` : ''}
            </div>
            
            <div class="recipe-body">
                <div class="ingredients-list">
                    <h3>Ingredientes</h3>
                    <ul>
                        ${ingredients.map(item => `
                            <li>${item.measure} ${item.ingredient}</li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="instructions">
                    <h3>Instruções</h3>
                    <p>${recipe.strInstructions}</p>
                </div>
            </div>
            
            ${recipe.strYoutube ? `
            <div class="video-container">
                <h3>Vídeo</h3>
                <div class="video-wrapper">
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/${recipe.strYoutube.split('v=')[1]}" frameborder="0" allowfullscreen></iframe>
                </div>
            </div>
            ` : ''}
        `;
        
        modalContent.appendChild(recipeDetail);
        recipeModal.style.display = 'block';
    }
    
    // Funções auxiliares para mostrar/ocultar estados
    function showLoading() {
        loadingElement.style.display = 'flex';
        resultsGrid.style.display = 'none';
        noResultsElement.style.display = 'none';
    }
    
    function hideLoading() {
        loadingElement.style.display = 'none';
        resultsGrid.style.display = 'grid';
    }
    
    function showNoResults() {
        noResultsElement.style.display = 'flex';
        resultsGrid.style.display = 'none';
    }
});

// Adicione localStorage para persistência
function toggleFavorite(recipeId) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const index = favorites.indexOf(recipeId);
    
    if (index === -1) {
        favorites.push(recipeId);
    } else {
        favorites.splice(index, 1);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
}