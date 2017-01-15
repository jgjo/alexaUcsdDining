from bs4 import BeautifulSoup
import urllib.request
from enum import Enum
import os,sys
import json

# enum to represent HTML identifier for diet options
class DietOptionsHtml(Enum):
    Vegitarian = 'vegetarian'
    Vegan = 'vegan'
    GlutenFree = 'glutenfree'
    DietitianApproved = 'tastebuds'     # Tastebuds image name corresponds to Dietitian Approvedon htmlpage

# enum to represent data descriptor for diet options
class DietOptions(Enum):
    Vegitarian = 'vegetarian'
    Vegan = 'vegan'
    GlutenFree = 'gluten friendly'
    DietitianApproved = 'dietitian approved'


class FoodItem:
    def __init__(self, name, mealType, dietOptions):
        self.name = name
        self.mealType = mealType
        self.dietOptions = dietOptions


def loadHtmlForRestaurantUrlId(restaurantId):
    url = "https://hdh.ucsd.edu/DiningMenus/default.aspx?i=" + restaurantId
    response = urllib.request.urlopen(url)
    return response.read()

def scrapeRestaurantHtml(html):
    soup = BeautifulSoup(html, 'html.parser')

    # Gives us the table with all the food items
    restaurantsTable = soup.find("table", id="MenuListing_tblDaily")

    # For url id '27' there is no table
    if restaurantsTable is None:
        return None

    # The table has 3 columns, breakfast, lunch and dinner in that order
    tableDivs = restaurantsTable.find_all("td", class_="menuList")

    breakfastItems = tableDivs[0].find_all("li")
    lunchItems = tableDivs[1].find_all("li")
    dinnerItems = tableDivs[2].find_all("li")

    foodData = []

    # extend used here to create one single list
    # instead an array of arrays returned from processFoodHtmlList
    foodData.extend(processFoodHtmlList(breakfastItems,'breakfast'))
    foodData.extend(processFoodHtmlList(lunchItems, 'lunch'))
    foodData.extend(processFoodHtmlList(dinnerItems, 'dinner'))

    return foodData


def processFoodHtmlList(listItems, mealType):
    foodItemArray = []
    for item in listItems:
        # item.get_text() gives -> Dietitian's Delight  ($3.95)
        # removing cost and trailing space in the end and converting to lowercase for uniformity
        foodName = item.get_text().split("(", 1)[0].strip().lower()

        # all diet options are represented as images next to the text
        # need to extract img tag and check the image source
        imageTags = item.find_all("img")
        dietOptions = []
        for img in imageTags:
            if DietOptionsHtml.Vegitarian.value in img['src']:
                dietOptions.append(DietOptions.Vegitarian.value)

            elif DietOptionsHtml.Vegan.value  in img['src']:
                dietOptions.append(DietOptions.Vegan.value)

            elif DietOptionsHtml.GlutenFree.value  in img['src']:
                dietOptions.append(DietOptions.GlutenFree.value)

            elif DietOptionsHtml.DietitianApproved.value  in img['src']:
                dietOptions.append(DietOptions.DietitianApproved.value)

        foodItem = FoodItem(foodName, mealType, dietOptions)
        foodItemArray.append(foodItem)

    return foodItemArray



def readRestaurantFromFile():
    f = open(os.path.join(sys.path[0], 'url_values.txt'))
    restaurantData = []
    for line in f:
        restaurantData.append(line.strip().split("\t",1))
    f.close()

    return restaurantData

def readRestaurantFromJsonFile():
    with open(os.path.join(sys.path[0], 'restaurants.txt')) as file:
        content = file.read()
        content = '[' + content + ']'
        parsedJson = json.loads(content)
        return parsedJson


# to print
# {
#     "name": "foodworx",
#     "url_id": "11"
# }
def printRestaurantJson(restaurantData):
    for data in restaurantData:
        jsonString = json.dumps({'name': data[1].lower(), 'url_id': data[0]}, indent = 4, separators = (',', ': '))
        jsonString += ','
        print(jsonString)


# to print
# {
#     "name": "Mahi Mahi Provencal",
#     "meal_type": "dinner",
#     "restaurant_id": "587a17089a993466bff7516e",
#     "diet_type": [
#         {
#             "type": "gluten friendly"
#         },
#         {
#             "type": "dietitian approved"
#         }
#     ]
# }
def printFoodJson(restaurantJson):

    for index in range(0,len(restaurantJson)):
        restaurant = restaurantJson[index]
        restaurantId = restaurant['_id']
        restaurantUrlId = restaurant['url_id']
        print("processing ", restaurantUrlId)
        htmlData = loadHtmlForRestaurantUrlId(restaurantUrlId)
        foodData = scrapeRestaurantHtml(htmlData)

        if foodData is None:
            continue

        jsonString = ''
        for food in foodData:
            jsonString += json.dumps({'name': food.name,
                                     'meal_type': food.mealType,
                                     'restaurant_id': restaurantId,
                                     'diet_type': [{'type' : dietOption} for dietOption in food.dietOptions]
                                    }, indent=4, separators=(',', ': '))
            jsonString += ','

        outputFileName = 'restaurantJson{0}_{1}.txt'.format(index,restaurantUrlId)
        print(outputFileName)
        f = open(outputFileName,'w')
        f.write(jsonString)
        f.close()

# restaurantData = readRestaurantFromFile()
# printRestaurantJson(restaurantData)

restaurantJson = readRestaurantFromJsonFile()
printFoodJson(restaurantJson)

# for food in data:
#     print(food.name)
#     print(food.mealType)
#     print(food.dietOptions)
#     print('~~~~~')
